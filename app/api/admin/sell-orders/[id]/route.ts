import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import SellOrder from "@/models/SellOrder";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const STATUSES = ["new", "pickup_scheduled", "picked_up", "inspected", "paid", "rejected"];

/** PATCH /api/admin/sell-orders/:id — update a sell order's status (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.status === "string" && STATUSES.includes(body.status)) {
      update.status = body.status;
    }
    await connectDB();
    const order = await SellOrder.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!order) {
      return NextResponse.json({ ok: false, error: "Sell order not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      order: { _id: String(order._id), status: order.status, orderNumber: order.orderNumber },
    });
  } catch (err) {
    console.error("[api PATCH /api/admin/sell-orders/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update sell order." }, { status: 500 });
  }
}

/** DELETE /api/admin/sell-orders/:id — remove a sell order (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await SellOrder.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Sell order not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/sell-orders/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete sell order." }, { status: 500 });
  }
}
