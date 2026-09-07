import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "./auth";

/** Retourne une réponse 401 si la requête n'est pas authentifiée, sinon null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json(
      { error: "Accès réservé aux organisateurs. Veuillez vous connecter." },
      { status: 401 }
    );
  }
  return null;
}
