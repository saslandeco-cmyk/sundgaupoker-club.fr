import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  removeRegistrantById,
  updateRegistrantById,
  type UpdateRegistrantError,
} from "@/lib/store";
import type { RegistrantInput } from "@/lib/types";

const UPDATE_ERROR_MESSAGES: Record<UpdateRegistrantError, { status: number; message: string }> = {
  not_found: { status: 404, message: "Inscription introuvable." },
  invalid_input: {
    status: 400,
    message: "Le prénom et le nom sont obligatoires, et l'email doit être valide.",
  },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ registrantId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { registrantId } = await params;
  const body = (await request.json().catch(() => ({}))) as Partial<RegistrantInput>;

  const result = await updateRegistrantById(registrantId, {
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    email: body.email,
    nickname: body.nickname,
  });

  if ("error" in result) {
    const { status, message } = UPDATE_ERROR_MESSAGES[result.error];
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ registrantId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { registrantId } = await params;
  const result = await removeRegistrantById(registrantId);
  if (!result) {
    return NextResponse.json(
      { error: "Inscription introuvable." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
