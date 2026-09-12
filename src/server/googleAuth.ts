import { OAuth2Client } from "google-auth-library";
import { StoredUser, loadUsers, saveUsers, getEnv } from "./userStore";

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
  const existingByGoogle = users.find((u) => u.googleSub === payload.sub);
  if (existingByGoogle) {
    existingByGoogle.name = payload.name || existingByGoogle.name;
    existingByGoogle.email = payload.email;
    existingByGoogle.picture = payload.picture || existingByGoogle.picture;
    existingByGoogle.lastLoginAt = now;
    saveUsers(users);
    return existingByGoogle;
  }

  // Same email already registered via email+password — link the Google identity to it
  // rather than creating a second, disconnected account for the same person.
  const existingByEmail = users.find((u) => u.email.toLowerCase() === payload.email!.toLowerCase());
  if (existingByEmail) {
    existingByEmail.googleSub = payload.sub;
    existingByEmail.picture = payload.picture || existingByEmail.picture;
    existingByEmail.lastLoginAt = now;
    saveUsers(users);
    return existingByEmail;
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
