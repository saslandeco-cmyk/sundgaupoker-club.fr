import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { removeRegistrantById } from "@/lib/store";

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
