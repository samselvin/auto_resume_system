import crypto from "crypto";
import dns from "dns";
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

/** Nodemailer resolves the SMTP host to both IPv4 and IPv6 addresses and then picks
 * ONE AT RANDOM to connect to. Many hosts (Render included) hand containers an IPv6
 * address that looks routable locally but can't actually reach the public internet, so
 * this random pick fails with ENETUNREACH roughly however often it lands on IPv6 —
 * intermittent by nature, not a credentials problem. Resolving to IPv4 ourselves and
 * connecting to that literal address sidesteps the coin flip; `tls.servername` keeps
 * certificate hostname verification checking against the real hostname instead of the
 * bare IP (whose cert wouldn't match otherwise). */
async function resolveIPv4(hostname: string): Promise<string> {
  // dns.lookup() goes through the OS's own resolver (getaddrinfo) rather than issuing a
  // raw DNS query itself, so it keeps working in sandboxes/containers that block outbound
  // port 53 but still resolve hostnames fine for every other connection (dns.resolve4()
  // would fail outright there and silently fall back to the very randomness we're avoiding).
  try {
    const { address } = await dns.promises.lookup(hostname, { family: 4 });
    return address;
  } catch {
    return hostname;
  }
}

function otpEmailContent(otp: string) {
  return {
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong style="font-size:20px;letter-spacing:2px;">${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  };
}

/** Resend sends over plain HTTPS (its API, not SMTP), so it isn't affected by hosts like
 * Render that block outbound SMTP ports entirely — confirmed via a raw TCP diagnostic:
 * ports 25/465/587 all timed out reaching Gmail from Render's network, while regular
 * HTTPS calls (this app already fetches LinkedIn jobs over HTTPS) work fine. This is why
 * Resend is tried first, ahead of SMTP. Without a verified sending domain, Resend's
 * default onboarding@resend.com sender can only deliver to the email that owns the
 * Resend account — fine for solo testing, not for real students until a domain is
 * verified and RESEND_FROM is set to an address on it. */
async function sendViaResend(email: string, otp: string, apiKey: string): Promise<void> {
  const fromName = process.env.RESEND_FROM_NAME || process.env.SMTP_FROM_NAME || "ATS Student Jobs";
  const fromAddress = process.env.RESEND_FROM || "onboarding@resend.com";
  const { subject, text, html } = otpEmailContent(otp);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: [email],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${body.slice(0, 300)}`);
  }
}

async function sendViaSmtp(email: string, otp: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME } = process.env;
  const connectHost = await resolveIPv4(SMTP_HOST!);
  const transporter = nodemailer.createTransport({
    host: connectHost,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { servername: SMTP_HOST },
  });

  // Note: this only sets the display name shown next to the address (e.g. "ATS Student
  // Jobs <you@gmail.com>"). Gmail's SMTP relay still requires the actual address to be
  // the authenticated account, so it's not fully hidden — a recipient who opens "show
  // details" still sees it. To truly not expose a personal inbox, send from a separate
  // account dedicated to the app, or a transactional provider with its own domain.
  const fromName = SMTP_FROM_NAME || "ATS Student Jobs";
  const fromAddress = SMTP_FROM || SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: email,
    ...otpEmailContent(otp),
  });
}

/** Sends the OTP through the best available channel, otherwise logs it to the server
 * console (mirrors this codebase's existing pattern of a working "dev" fallback provider
 * — see the SMS provider abstraction in the sibling attendance-system project — instead
 * of a silent no-op or a hard crash when nothing is configured yet). Resend is tried
 * first since it's what actually works on this app's target host (Render); SMTP is kept
 * as a fallback since it works fine in environments that don't block those ports (e.g.
 * local dev). */
async function sendOtpEmail(email: string, otp: string): Promise<{ sent: boolean }> {
  const { RESEND_API_KEY, SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  if (RESEND_API_KEY) {
    try {
      await sendViaResend(email, otp, RESEND_API_KEY);
      return { sent: true };
    } catch (e) {
      // Fall through to the console-log dev fallback below rather than hard-failing
      // sign-up — e.g. the Resend account has no verified domain yet. The real error is
      // still logged server-side so it's not silently lost.
      console.warn("Resend send failed, falling back to console-logged code:", e);
    }
  } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      await sendViaSmtp(email, otp);
      return { sent: true };
    } catch (e) {
      console.warn("SMTP send failed, falling back to console-logged code:", e);
    }
  }

  console.log(`\n[dev email] Verification code for ${email}: ${otp} (expires in 10 minutes)\n`);
  return { sent: false };
}

export async function startEmailSignup(
  rawEmail: string,
  name: string
): Promise<{ delivered: boolean; devOtp?: string }> {
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
  if (sent) return { delivered: true };
  // The code is always logged server-side above regardless of environment. Handing it
  // back in the API response too is a convenience for local testing, but in production
  // it would let anyone "verify" any email address without ever proving they own it —
  // the whole point of the OTP step — so it's withheld there even if email delivery
  // isn't configured yet.
  return process.env.NODE_ENV === "production" ? { delivered: false } : { delivered: false, devOtp: otp };
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
