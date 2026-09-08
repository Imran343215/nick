import { NextResponse } from "next/server";
import { fetchTheme } from "@/lib/theme";
import { jsonWithCors, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

/** GET /api/theme — public endpoint returning the active site theme. */
export async function GET() {
  const theme = await fetchTheme();
  return jsonWithCors({ ok: true, theme });
}

/** Handle OPTIONS requests for CORS preflight */
export async function OPTIONS() {
  return handleOptions();
}
