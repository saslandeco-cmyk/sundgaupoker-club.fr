import { NextResponse } from "next/server";
import { readTournaments } from "@/lib/store";
import { toPublicTournament } from "@/lib/types";

export async function GET() {
  const tournaments = await readTournaments();
  return NextResponse.json(tournaments.map(toPublicTournament));
}
