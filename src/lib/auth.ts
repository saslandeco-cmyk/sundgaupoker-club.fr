import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 heures

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "poker-admin";
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || `secret-${ADMIN_PASSWORD}`;

if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
  console.warn(
    "[auth] ADMIN_PASSWORD n'est pas défini : un mot de passe par défaut est utilisé. " +
      "Définissez ADMIN_PASSWORD (et ADMIN_SESSION_SECRET) dans votre environnement."
  );
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkAdminPassword(password: string): boolean {
  if (!password) return false;
  return safeEqual(password, ADMIN_PASSWORD);
}

/** Crée un jeton de session `expiry.signature`, sans état côté serveur. */
export function createSessionToken(): string {
  const expiry = Date.now() + SESSION_DURATION_MS;
  const signature = sign(String(expiry));
  return `${expiry}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiryRaw, signature] = token.split(".");
  if (!expiryRaw || !signature) return false;
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  return safeEqual(sign(expiryRaw), signature);
}

/** À utiliser dans les Server Components / Route Handlers (contexte serveur). */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}
