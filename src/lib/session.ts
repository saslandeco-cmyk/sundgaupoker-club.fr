import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 heures

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Comparaison en temps constant entre le mot de passe saisi et celui attendu. */
export function checkPassword(password: string, expected: string): boolean {
  if (!password) return false;
  return safeEqual(password, expected);
}

/** Crée un jeton de session `expiry.signature`, sans état côté serveur. */
export function createSessionToken(
  secret: string,
  durationMs: number = DEFAULT_SESSION_DURATION_MS
): string {
  const expiry = Date.now() + durationMs;
  const signature = sign(String(expiry), secret);
  return `${expiry}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string
): boolean {
  if (!token) return false;
  const [expiryRaw, signature] = token.split(".");
  if (!expiryRaw || !signature) return false;
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  return safeEqual(sign(expiryRaw, secret), signature);
}
