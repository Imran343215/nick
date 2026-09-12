import { NextResponse } from "next/server";
import { fetchActiveVariantsForDevice } from "@/lib/sell-catalog";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** GET /api/sell/variants?deviceId=xxx — active storage/RAM variants for a device. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = clean(searchParams.get("deviceId"));
    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "deviceId is required." }, { status: 400 });
    }
    const variants = await fetchActiveVariantsForDevice(deviceId);
    return NextResponse.json({ ok: true, variants });
  } catch (err) {
    console.error("[api GET /api/sell/variants]", err);
    return NextResponse.json({ ok: false, error: "Could not load variants." }, { status: 500 });
  }
}
