import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import RepairCoupon from "@/models/RepairCoupon";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

function serializeCoupon(doc: Record<string, unknown>) {
  return {
    _id: String(doc._id),
    code: doc.code as string,
    discountType: doc.discountType as string,
    value: doc.value as number,
    minSubtotal: doc.minSubtotal as number | undefined,
    maxDiscount: doc.maxDiscount as number | undefined,
    status: doc.status as string,
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt as string).toISOString() : null,
  };
}

/** GET /api/admin/coupons */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const coupons = await RepairCoupon.find().sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json({ ok: true, coupons: coupons.map(serializeCoupon) });
  } catch (err) {
    console.error("[api GET /api/admin/coupons]", err);
    return NextResponse.json({ ok: false, error: "Could not load coupons." }, { status: 500 });
  }
}

/** POST /api/admin/coupons */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const code = clean(body.code).toUpperCase();
    const discountType = body.discountType === "fixed" ? "fixed" : "percent";
    const value = Number(body.value);
    const status = body.status === "inactive" ? "inactive" : "active";
    const minSubtotal = body.minSubtotal != null ? Number(body.minSubtotal) : undefined;
    const maxDiscount = body.maxDiscount != null ? Number(body.maxDiscount) : undefined;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    if (!code || !Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { ok: false, error: "Code and valid discount value are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const existing = await RepairCoupon.findOne({ code }).lean().exec();
    if (existing) {
      return NextResponse.json({ ok: false, error: "Coupon code already exists." }, { status: 409 });
    }

    const coupon = await RepairCoupon.create({
      code,
      discountType,
      value,
      minSubtotal: Number.isFinite(minSubtotal) ? minSubtotal : undefined,
      maxDiscount: Number.isFinite(maxDiscount) ? maxDiscount : undefined,
      status,
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : undefined,
    });
    return NextResponse.json(
      { ok: true, coupon: serializeCoupon(coupon.toObject()) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/coupons]", err);
    return NextResponse.json({ ok: false, error: "Could not create coupon." }, { status: 500 });
  }
}
