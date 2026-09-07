import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listAllRegistrants } from "@/lib/store";
import { registrantsToCsv } from "@/lib/csv";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const rows = await listAllRegistrants();
  const csv = registrantsToCsv(rows);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscrits-${date}.csv"`,
    },
  });
}
