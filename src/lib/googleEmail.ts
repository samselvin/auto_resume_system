const GOOGLE_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'google.com']);

export function isGoogleEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  const at = clean.lastIndexOf('@');
  if (at < 1) return false;
  const domain = clean.slice(at + 1);
  return GOOGLE_DOMAINS.has(domain);
}
