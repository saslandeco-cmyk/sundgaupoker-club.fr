import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { removeAuthorizedMember } from "@/lib/members";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { memberId } = await params;
  const ok = await removeAuthorizedMember(memberId);
  if (!ok) {
    return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
