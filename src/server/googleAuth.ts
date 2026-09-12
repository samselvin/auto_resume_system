import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

export interface StoredUser {
  id: string;
  googleSub: string;
  name: string;
  email: string;
  picture?: string;
  createdAt: string;
  lastLoginAt: string;
}

const USERS_PATH = path.join(process.cwd(), "data", "users.json");
const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
      return Array.isArray(raw) ? raw : [];
    }
  } catch {
    /* ignore, treat as empty */
  }
  return [];
}

function saveUsers(users: StoredUser[]) {
  const dir = path.dirname(USERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to your .env file — see .env.example for setup instructions.`
    );
  }
  return value;
}

let cachedClient: OAuth2Client | null = null;
function getOAuthClient(): OAuth2Client {
  if (!cachedClient) {
    cachedClient = new OAuth2Client(getEnv("GOOGLE_CLIENT_ID"));
  }
  return cachedClient;
}

/** Verify a Google Identity Services ID token and upsert the matching local user record. */
export async function verifyGoogleCredential(credential: string): Promise<StoredUser> {
  const client = getOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: getEnv("GOOGLE_CLIENT_ID"),
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Google did not return a valid identity for this token.");
  }
  if (!payload.email_verified) {
    throw new Error("This Google account's email is not verified.");
  }

  const users = loadUsers();
  const now = new Date().toISOString();
  const existing = users.find((u) => u.googleSub === payload.sub);

  if (existing) {
    existing.name = payload.name || existing.name;
    existing.email = payload.email;
    existing.picture = payload.picture || existing.picture;
    existing.lastLoginAt = now;
    saveUsers(users);
    return existing;
  }

  const created: StoredUser = {
    id: `user-${payload.sub}`,
    googleSub: payload.sub,
    name: payload.name || payload.email.split("@")[0],
    email: payload.email,
    picture: payload.picture,
    createdAt: now,
    lastLoginAt: now,
  };
  users.push(created);
  saveUsers(users);
  return created;
}

export function issueSessionToken(user: StoredUser): string {
  return jwt.sign({ uid: user.id }, getEnv("SESSION_SECRET"), {
    expiresIn: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
}

export function setSessionCookie(res: { cookie: Function }, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res: { clearCookie: Function }) {
  res.clearCookie(SESSION_COOKIE);
}

/** Resolve the logged-in user from the session cookie, or null if absent/invalid/expired. */
export function getUserFromSession(cookies: Record<string, string | undefined>): StoredUser | null {
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getEnv("SESSION_SECRET")) as { uid: string };
    const users = loadUsers();
    return users.find((u) => u.id === decoded.uid) || null;
  } catch {
    return null;
  }
}

export function toPublicUser(user: StoredUser) {
  return { id: user.id, name: user.name, email: user.email, picture: user.picture };
}
