import { NextResponse } from "next/server";
import { clean } from "@/lib/utils";
import { getChatMessagesSince } from "@/lib/chat";

export const dynamic = "force-dynamic";

/** GET /api/chat/poll?sessionId=...&since=... — fetch new chat messages for a session. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = clean(searchParams.get("sessionId"));
    const since = Number(searchParams.get("since") || 0);

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "sessionId is required." },
        { status: 400 }
      );
    }

    const { messages, nextSinceTs } = await getChatMessagesSince(
      sessionId,
      Number.isFinite(since) ? since : 0
    );

    return NextResponse.json({ ok: true, messages, nextSinceTs });
  } catch (err) {
    console.error("[api GET /api/chat/poll]", err);
    return NextResponse.json(
      { ok: false, error: "Could not fetch messages." },
      { status: 500 }
    );
  }
}
