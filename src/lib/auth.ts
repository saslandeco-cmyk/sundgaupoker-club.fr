import { cookies } from "next/headers";
import {
  checkPassword,
  createSessionToken as createToken,
  verifySessionToken as verifyToken,
} from "./session";

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

export function checkAdminPassword(password: string): boolean {
  return checkPassword(password, ADMIN_PASSWORD);
}

/** Crée un jeton de session `expiry.signature`, sans état côté serveur. */
export function createSessionToken(): string {
  return createToken(SESSION_SECRET, SESSION_DURATION_MS);
}

export function verifySessionToken(token: string | undefined): boolean {
  return verifyToken(token, SESSION_SECRET);
}

/** À utiliser dans les Server Components / Route Handlers (contexte serveur). */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}
