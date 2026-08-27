import { NextResponse } from "next/server";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat/send — forward a visitor's WhatsApp-widget message to the
 * baileys-service bridge, which holds the actual WhatsApp socket and can't
 * run on Vercel. This route just authenticates the hop with an internal
 * shared secret and relays the bridge's response back to the widget.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = clean(body.sessionId);
    const text = clean(body.text);
    const name = clean(body.name) || "Website visitor";

    if (!sessionId || !text) {
      return NextResponse.json(
        { ok: false, error: "sessionId and text are required." },
        { status: 400 }
      );
    }

    const serviceUrl = process.env.BAILEYS_SERVICE_URL;
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (!serviceUrl || !internalSecret) {
      console.error(
        "[api POST /api/chat/send] BAILEYS_SERVICE_URL or INTERNAL_API_SECRET is not configured"
      );
      return NextResponse.json(
        { ok: false, error: "Chat is not configured." },
        { status: 500 }
      );
    }

    const res = await fetch(`${serviceUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({ sessionId, text, name }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api POST /api/chat/send]", err);
    return NextResponse.json(
      { ok: false, error: "Could not send message." },
      { status: 500 }
    );
  }
}
