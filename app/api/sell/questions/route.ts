import { NextResponse } from "next/server";
import { fetchActiveQuestions } from "@/lib/sell-catalog";

export const dynamic = "force-dynamic";

/** GET /api/sell/questions — active condition questionnaire, in display order. */
export async function GET() {
  try {
    const questions = await fetchActiveQuestions();
    return NextResponse.json({ ok: true, questions });
  } catch (err) {
    console.error("[api GET /api/sell/questions]", err);
    return NextResponse.json({ ok: false, error: "Could not load questions." }, { status: 500 });
  }
}
