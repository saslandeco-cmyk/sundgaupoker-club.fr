import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteTournament, updateTournament, type UpdateError } from "@/lib/store";
import type { TournamentInput } from "@/lib/types";

const UPDATE_ERROR_MESSAGES: Record<
  UpdateError,
  { status: number; message: string }
> = {
  not_found: { status: 404, message: "Tournoi introuvable." },
  invalid_input: {
    status: 400,
    message: "Nom, date, lieu et un nombre de places d'au moins 2 sont obligatoires.",
  },
  below_registered: {
    status: 409,
    message:
      "Le nombre de places ne peut pas être inférieur au nombre d'inscrits actuel.",
  },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Partial<TournamentInput>;

  const result = await updateTournament(id, {
    name: body.name ?? "",
    description: body.description,
    date: body.date ?? "",
    venue: body.venue ?? "",
    startTime: body.startTime,
    startingStack: body.startingStack,
    roundDuration: body.roundDuration,
    breakInfo: body.breakInfo,
    finalTable: body.finalTable,
    maxSeats: Number(body.maxSeats),
    onlineRegistration: Boolean(body.onlineRegistration),
  });

  if ("error" in result) {
    const { status, message } = UPDATE_ERROR_MESSAGES[result.error];
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(result.tournament);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const ok = await deleteTournament(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Tournoi introuvable." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
