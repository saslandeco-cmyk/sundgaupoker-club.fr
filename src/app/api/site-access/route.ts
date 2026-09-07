import { NextRequest, NextResponse } from "next/server";
import {
  SITE_ACCESS_COOKIE,
  checkSitePassword,
  createSiteSessionToken,
} from "@/lib/site-access";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!checkSitePassword(body.password ?? "")) {
    return NextResponse.json(
      { error: "Mot de passe incorrect." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_ACCESS_COOKIE, createSiteSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours, aligné sur la durée du jeton
  });
  return response;
}
