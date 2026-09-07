import { NextRequest, NextResponse } from "next/server";
import { addRegistrant, type RegisterError } from "@/lib/store";
import { toPublicTournament, type RegistrantInput } from "@/lib/types";
import { notifyNewRegistration } from "@/lib/notifications";

const ERROR_MESSAGES: Record<RegisterError, { status: number; message: string }> = {
  not_found: { status: 404, message: "Tournoi introuvable." },
  closed: { status: 409, message: "Ce tournoi est déjà passé." },
  full: { status: 409, message: "Ce tournoi est complet." },
  offline_only: {
    status: 409,
    message: "L'inscription en ligne n'est pas activée pour ce tournoi.",
  },
  invalid_input: {
    status: 400,
    message: "Le prénom, le nom et une adresse email valide sont obligatoires.",
  },
  already_registered: {
    status: 409,
    message: "Cette personne est déjà inscrite à ce tournoi.",
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Partial<RegistrantInput>;

  const result = await addRegistrant(id, {
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    email: body.email ?? "",
    nickname: body.nickname,
  });

  if ("error" in result) {
    const { status, message } = ERROR_MESSAGES[result.error];
    return NextResponse.json({ error: message }, { status });
  }

  notifyNewRegistration(result.tournament, result.registrant);

  return NextResponse.json(toPublicTournament(result.tournament), {
    status: 201,
  });
}
