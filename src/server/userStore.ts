import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  googleSub?: string;
  passwordHash?: string;
  emailVerifiedAt?: string;
  createdAt: string;
  lastLoginAt: string;
}

const USERS_PATH = path.join(process.cwd(), "data", "users.json");
const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function loadUsers(): StoredUser[] {
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

export function saveUsers(users: StoredUser[]) {
  const dir = path.dirname(USERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const key = email.trim().toLowerCase();
  return loadUsers().find((u) => u.email.toLowerCase() === key);
}

export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to your .env file — see .env.example for setup instructions.`
    );
  }
  return value;
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
    return loadUsers().find((u) => u.id === decoded.uid) || null;
  } catch {
    return null;
  }
}

export function toPublicUser(user: StoredUser) {
  return { id: user.id, name: user.name, email: user.email, picture: user.picture };
}
