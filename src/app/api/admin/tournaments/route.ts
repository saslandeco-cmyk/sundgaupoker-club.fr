import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createTournament, readTournaments } from "@/lib/store";
import type { TournamentInput } from "@/lib/types";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const tournaments = await readTournaments();
  return NextResponse.json(tournaments);
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as Partial<TournamentInput>;

  if (!body.name?.trim() || !body.date || !body.venue?.trim()) {
    return NextResponse.json(
      { error: "Nom, date et lieu sont obligatoires." },
      { status: 400 }
    );
  }

  const maxSeats = Number(body.maxSeats);
  if (!Number.isFinite(maxSeats) || maxSeats < 2) {
    return NextResponse.json(
      { error: "Le nombre de places doit être un nombre d'au moins 2." },
      { status: 400 }
    );
  }

  const tournament = await createTournament({
    name: body.name,
    description: body.description,
    date: body.date,
    venue: body.venue,
    startTime: body.startTime,
    startingStack: body.startingStack,
    roundDuration: body.roundDuration,
    breakInfo: body.breakInfo,
    finalTable: body.finalTable,
    maxSeats,
    onlineRegistration: Boolean(body.onlineRegistration),
  });

  return NextResponse.json(tournament, { status: 201 });
}
