import { NextResponse } from "next/server";
import { validateRepairCoupon } from "@/lib/repair-coupons";

export const dynamic = "force-dynamic";

/** POST /api/repair-coupons/validate */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code : "";
    const subtotal = Number(body.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ ok: false, error: "Invalid subtotal." }, { status: 400 });
    }
    const result = await validateRepairCoupon(code, subtotal);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      code: result.code,
      discount: result.discount,
    });
  } catch (err) {
    console.error("[api POST /api/repair-coupons/validate]", err);
    return NextResponse.json({ ok: false, error: "Could not validate coupon." }, { status: 500 });
  }
}
