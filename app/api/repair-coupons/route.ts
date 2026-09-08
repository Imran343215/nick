import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateRepairCoupon } from "@/lib/repair-coupons";
import { jsonWithCors, handleOptions } from "@/lib/cors";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** POST /api/repair-coupons/validate — public endpoint to validate a repair coupon */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = clean(body.code).toUpperCase();
    const subtotal = Number(body.subtotal);

    if (!code) {
      return jsonWithCors({ ok: false, error: "Enter a coupon code." }, { status: 400 });
    }

    await connectDB();
    const result = await validateRepairCoupon(code, subtotal);
    return jsonWithCors(result);
  } catch (err) {
    console.error("[api POST /api/repair-coupons/validate]", err);
    return jsonWithCors({ ok: false, error: "Could not validate coupon." }, { status: 500 });
  }
}

export async function OPTIONS() {
  return handleOptions();
}