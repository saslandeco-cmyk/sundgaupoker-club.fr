import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { removeRegistrant } from "@/lib/store";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; registrantId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id, registrantId } = await params;
  const tournament = await removeRegistrant(id, registrantId);
  if (!tournament) {
    return NextResponse.json(
      { error: "Tournoi introuvable." },
      { status: 404 }
    );
  }
  return NextResponse.json(tournament);
}
