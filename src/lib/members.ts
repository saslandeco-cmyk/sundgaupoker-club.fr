import { getSql, isBuildPhase } from "./db";

export interface AuthorizedMember {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface MemberRow {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

function mapRow(row: MemberRow): AuthorizedMember {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at.toISOString(),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Liste tous les membres autorisés, du plus récent au plus ancien. */
export async function listAuthorizedMembers(): Promise<AuthorizedMember[]> {
  if (isBuildPhase) return [];
  const sql = await getSql();
  const rows = await sql<
    MemberRow[]
  >`SELECT * FROM authorized_members ORDER BY created_at DESC`;
  return rows.map(mapRow);
}

/** `true` si cet email figure dans la liste des personnes autorisées à s'inscrire. */
export async function isEmailAuthorized(email: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql`
    SELECT 1 FROM authorized_members WHERE email = ${normalizeEmail(email)} LIMIT 1
  `;
  return rows.length > 0;
}

export type AddMemberError = "invalid_input" | "already_exists";

export async function addAuthorizedMember(input: {
  email: string;
  name?: string;
}): Promise<{ member: AuthorizedMember } | { error: AddMemberError }> {
  const email = normalizeEmail(input.email ?? "");
  const name = input.name?.trim() ?? "";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "invalid_input" };
  }

  const sql = await getSql();
  const existing = await sql`
    SELECT 1 FROM authorized_members WHERE email = ${email} LIMIT 1
  `;
  if (existing.length > 0) {
    return { error: "already_exists" };
  }

  const rows = await sql<MemberRow[]>`
    INSERT INTO authorized_members (id, email, name)
    VALUES (${globalThis.crypto.randomUUID()}, ${email}, ${name})
    RETURNING *
  `;
  return { member: mapRow(rows[0]) };
}

/** Retire un membre de la liste des personnes autorisées. */
export async function removeAuthorizedMember(id: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql`DELETE FROM authorized_members WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
