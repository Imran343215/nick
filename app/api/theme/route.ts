import { NextResponse } from "next/server";
import { fetchTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

/** GET /api/theme — public endpoint returning the active site theme. */
export async function GET() {
  const theme = await fetchTheme();
  return NextResponse.json({ ok: true, theme });
}
