import { NextResponse } from "next/server";
import { readTournaments } from "@/lib/store";
import { isSiteAuthenticated } from "@/lib/site-access";
import { toPublicTournament } from "@/lib/types";

export async function GET() {
  if (!(await isSiteAuthenticated())) {
    return NextResponse.json(
      { error: "Accès réservé. Veuillez saisir le mot de passe du club." },
      { status: 401 }
    );
  }
  const tournaments = await readTournaments();
  return NextResponse.json(tournaments.map(toPublicTournament));
}
