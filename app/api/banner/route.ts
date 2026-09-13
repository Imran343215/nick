import { NextResponse } from "next/server";
import { fetchPublicBanner } from "@/lib/banner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banner = await fetchPublicBanner();
    return NextResponse.json({ ok: true, ...banner });
  } catch (err) {
    console.error("[api GET /api/banner]", err);
    return NextResponse.json({ ok: false, slides: [], settings: { enabled: true, autoplaySeconds: 5 } });
  }
}
