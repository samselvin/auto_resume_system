import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { StoredUser, loadUsers, saveUsers, findUserByEmail } from "./userStore";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

interface PendingOtp {
  otpHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  name?: string;
}

// In-memory: OTPs are short-lived, so losing them on a dev-server restart just means
// the student requests a new code — not worth persisting to disk.
const pendingOtps = new Map<string, PendingOtp>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Sends the OTP over real SMTP when configured, otherwise logs it to the server console
 * (mirrors this codebase's existing pattern of a working "dev" fallback provider — see the
 * SMS provider abstraction in the sibling attendance-system project — instead of a silent
 * no-op or a hard crash when credentials aren't set up yet). */
async function sendOtpEmail(email: string, otp: string): Promise<{ sent: boolean }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`\n[dev email] Verification code for ${email}: ${otp} (expires in 10 minutes)\n`);
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong style="font-size:20px;letter-spacing:2px;">${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
  return { sent: true };
}

export async function startEmailSignup(
  rawEmail: string,
  name: string
): Promise<{ devOtp?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!name.trim()) {
    throw new Error("Please enter your name.");
  }

  const existing = findUserByEmail(email);
  if (existing?.passwordHash) {
    throw new Error(`An account with "${email}" already exists. Please sign in instead.`);
  }

  const pending = pendingOtps.get(email);
  if (pending && Date.now() - pending.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - pending.lastSentAt)) / 1000);
    throw new Error(`Please wait ${waitSec}s before requesting another code.`);
  }

  const otp = generateOtp();
  pendingOtps.set(email, {
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now(),
    name: name.trim(),
  });

  const { sent } = await sendOtpEmail(email, otp);
  return sent ? {} : { devOtp: otp };
}

export async function verifyEmailSignup(
  rawEmail: string,
  otp: string,
  password: string
): Promise<StoredUser> {
  const email = normalizeEmail(rawEmail);
  const pending = pendingOtps.get(email);

  if (!pending || Date.now() > pending.expiresAt) {
    pendingOtps.delete(email);
    throw new Error("That code expired or was never requested. Request a new one.");
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    pendingOtps.delete(email);
    throw new Error("Too many incorrect attempts. Request a new code.");
  }
  if (hashOtp(otp.trim()) !== pending.otpHash) {
    pending.attempts += 1;
    throw new Error("Incorrect code. Please check your email and try again.");
  }
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  pendingOtps.delete(email);
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const users = loadUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email);
  if (existing) {
    // Already had a Google-only account for this email — add a password to it instead
    // of creating a second, disconnected account for the same person.
    existing.passwordHash = passwordHash;
    existing.emailVerifiedAt = now;
    existing.lastLoginAt = now;
    saveUsers(users);
    return existing;
  }

  const created: StoredUser = {
    id: `user-${crypto.randomUUID()}`,
    name: pending.name || email.split("@")[0],
    email,
    passwordHash,
    emailVerifiedAt: now,
    createdAt: now,
    lastLoginAt: now,
  };
  users.push(created);
  saveUsers(users);
  return created;
}

export async function loginWithPassword(rawEmail: string, password: string): Promise<StoredUser> {
  const email = normalizeEmail(rawEmail);
  const user = findUserByEmail(email);

  if (!user || !user.passwordHash) {
    throw new Error(
      user
        ? "This account uses Google Sign-In. Use Continue with Google instead, or create a password by verifying your email again."
        : `No account found for "${email}". Please create an account first.`
    );
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new Error("Incorrect password.");
  }

  const users = loadUsers();
  const stored = users.find((u) => u.id === user.id)!;
  stored.lastLoginAt = new Date().toISOString();
  saveUsers(users);
  return stored;
}
