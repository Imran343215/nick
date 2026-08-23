import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Order from "@/models/Order";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/orders/:id — update fulfillment status + shipping info (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed()))
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const order = await Order.findById(id).lean().exec();
    if (!order)
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });

    const update: Record<string, unknown> = {};

    if (typeof body.fulfillmentStatus === "string") {
      if (!VALID_STATUSES.includes(body.fulfillmentStatus))
        return NextResponse.json({ ok: false, error: "Invalid fulfilment status." }, { status: 400 });
      update.fulfillmentStatus = body.fulfillmentStatus;
    }
    if (typeof body.shippingCarrier === "string")
      update.shippingCarrier = clean(body.shippingCarrier);
    if (typeof body.shippingNumber === "string")
      update.shippingNumber = clean(body.shippingNumber);

    const updated = await Order.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    console.error("[api PATCH /api/admin/orders/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update order." }, { status: 500 });
  }
}