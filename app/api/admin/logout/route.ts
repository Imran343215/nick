import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/logout — clear the admin session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
  return res;
}