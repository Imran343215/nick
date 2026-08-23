import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import RepairCoupon from "@/models/RepairCoupon";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

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

/** PATCH /api/admin/coupons/:id */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};
    if (typeof body.code === "string" && clean(body.code)) update.code = clean(body.code).toUpperCase();
    if (body.discountType === "percent" || body.discountType === "fixed") {
      update.discountType = body.discountType;
    }
    if (typeof body.value === "number" && Number.isFinite(body.value)) update.value = body.value;
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (body.minSubtotal === null || body.minSubtotal === "") update.minSubtotal = undefined;
    else if (typeof body.minSubtotal === "number") update.minSubtotal = body.minSubtotal;
    if (body.maxDiscount === null || body.maxDiscount === "") update.maxDiscount = undefined;
    else if (typeof body.maxDiscount === "number") update.maxDiscount = body.maxDiscount;
    if (body.expiresAt === null || body.expiresAt === "") update.expiresAt = undefined;
    else if (typeof body.expiresAt === "string" && body.expiresAt) {
      update.expiresAt = new Date(body.expiresAt);
    }

    const coupon = await RepairCoupon.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!coupon) {
      return NextResponse.json({ ok: false, error: "Coupon not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, coupon: serializeCoupon(coupon) });
  } catch (err) {
    console.error("[api PATCH /api/admin/coupons/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update coupon." }, { status: 500 });
  }
}

/** DELETE /api/admin/coupons/:id */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await RepairCoupon.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Coupon not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/coupons/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete coupon." }, { status: 500 });
  }
}
