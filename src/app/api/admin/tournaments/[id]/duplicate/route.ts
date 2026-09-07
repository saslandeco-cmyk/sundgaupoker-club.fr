import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { duplicateTournament } from "@/lib/store";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const duplicate = await duplicateTournament(id);
  if (!duplicate) {
    return NextResponse.json(
      { error: "Tournoi introuvable." },
      { status: 404 }
    );
  }
  return NextResponse.json(duplicate, { status: 201 });
}
