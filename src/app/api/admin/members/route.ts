import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  addAuthorizedMember,
  listAuthorizedMembers,
  type AddMemberError,
} from "@/lib/members";

const ERROR_MESSAGES: Record<AddMemberError, { status: number; message: string }> = {
  invalid_input: { status: 400, message: "Une adresse email valide est obligatoire." },
  already_exists: { status: 409, message: "Cette adresse est déjà dans la liste." },
};

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const members = await listAuthorizedMembers();
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
  };

  const result = await addAuthorizedMember({
    email: body.email ?? "",
    name: body.name,
  });

  if ("error" in result) {
    const { status, message } = ERROR_MESSAGES[result.error];
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(result.member, { status: 201 });
}
