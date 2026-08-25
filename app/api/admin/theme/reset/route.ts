import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { resetTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

/** POST /api/admin/theme/reset — delete the stored theme, back to defaults. */
export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const theme = await resetTheme();
    return NextResponse.json({ ok: true, theme });
  } catch (err) {
    console.error("[api POST /api/admin/theme/reset]", err);
    return NextResponse.json({ ok: false, error: "Could not reset the theme." }, { status: 500 });
  }
}
