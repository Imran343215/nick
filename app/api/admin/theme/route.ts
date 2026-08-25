import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { fetchTheme, saveTheme, sanitizeTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

/** GET /api/admin/theme — current theme config for the customizer UI. */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const theme = await fetchTheme();
    return NextResponse.json({ ok: true, theme });
  } catch (err) {
    console.error("[api GET /api/admin/theme]", err);
    return NextResponse.json({ ok: false, error: "Could not load the theme." }, { status: 500 });
  }
}

/** PUT /api/admin/theme — save the whole theme config (admin). */
export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    // sanitizeTheme validates every field and merges missing keys with defaults.
    const theme = sanitizeTheme(body);
    await saveTheme(theme);
    return NextResponse.json({ ok: true, theme });
  } catch (err) {
    console.error("[api PUT /api/admin/theme]", err);
    return NextResponse.json({ ok: false, error: "Could not save the theme." }, { status: 500 });
  }
}
