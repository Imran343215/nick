import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminToken,
  cookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/login — authenticate and set the admin session cookie. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    if (!password || password !== (process.env.ADMIN_PASSWORD || "admin123")) {
      return NextResponse.json(
        { ok: false, error: "Incorrect admin password." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, createAdminToken(), cookieOptions());
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }
}