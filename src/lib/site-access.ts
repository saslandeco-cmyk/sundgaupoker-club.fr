import { cookies } from "next/headers";
import {
  checkPassword,
  createSessionToken as createToken,
  verifySessionToken as verifyToken,
} from "./session";

export const SITE_ACCESS_COOKIE = "site_access";
// Session longue (30 jours) : contrairement à l'admin, on ne veut pas
// obliger les joueurs à ressaisir le mot de passe à chaque visite.
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const SITE_PASSWORD = process.env.SITE_PASSWORD;
const SESSION_SECRET =
  process.env.SITE_SESSION_SECRET || `secret-${SITE_PASSWORD ?? "site"}`;

if (process.env.NODE_ENV === "production" && !process.env.SITE_PASSWORD) {
  console.warn(
    "[site-access] SITE_PASSWORD n'est pas défini : la page /tournois reste " +
      "accessible sans mot de passe. Définissez SITE_PASSWORD dans votre " +
      "environnement pour activer le verrou d'accès."
  );
}

/** `true` si un mot de passe d'accès a été configuré côté serveur. */
export function isSiteAccessConfigured(): boolean {
  return Boolean(SITE_PASSWORD);
}

export function checkSitePassword(password: string): boolean {
  if (!SITE_PASSWORD) return false;
  return checkPassword(password, SITE_PASSWORD);
}

export function createSiteSessionToken(): string {
  return createToken(SESSION_SECRET, SESSION_DURATION_MS);
}

export function verifySiteSessionToken(token: string | undefined): boolean {
  return verifyToken(token, SESSION_SECRET);
}

/**
 * `true` si la page publique est accessible : soit aucun mot de passe n'est
 * configuré (verrou désactivé), soit la personne a déjà le cookie de
 * session valide.
 */
export async function isSiteAuthenticated(): Promise<boolean> {
  if (!isSiteAccessConfigured()) return true;
  const store = await cookies();
  return verifySiteSessionToken(store.get(SITE_ACCESS_COOKIE)?.value);
}
