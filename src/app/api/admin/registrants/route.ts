import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  addManualRegistrant,
  listAllRegistrants,
  type ManualRegisterError,
} from "@/lib/store";
import type { RegistrantInput } from "@/lib/types";
import { notify } from "@/lib/notify";

const ERROR_MESSAGES: Record<
  ManualRegisterError,
  { status: number; message: string }
> = {
  not_found: { status: 404, message: "Tournoi introuvable." },
  closed: { status: 409, message: "Ce tournoi est déjà passé." },
  full: { status: 409, message: "Ce tournoi est complet." },
  invalid_input: {
    status: 400,
    message: "Le tournoi, le prénom et le nom sont obligatoires.",
  },
  already_registered: {
    status: 409,
    message: "Cette personne est déjà inscrite à ce tournoi.",
  },
};

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const rows = await listAllRegistrants();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => ({}))) as Partial<
    RegistrantInput & { tournamentId: string }
  >;

  if (!body.tournamentId) {
    return NextResponse.json(
      { error: "Sélectionnez un tournoi." },
      { status: 400 }
    );
  }

  const result = await addManualRegistrant(body.tournamentId, {
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    email: body.email ?? "",
    nickname: body.nickname,
  });

  if ("error" in result) {
    const { status, message } = ERROR_MESSAGES[result.error];
    return NextResponse.json({ error: message }, { status });
  }

  await notify({ tournament: result.tournament, registrant: result.registrant });

  return NextResponse.json(result.tournament, { status: 201 });
}
