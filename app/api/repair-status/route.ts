import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RepairOrder, {
  ORDER_STATUS_DESCRIPTIONS,
  type OrderStatus,
} from "@/models/RepairOrder";

export const dynamic = "force-dynamic";

function serializeOrder(order: Record<string, any>) {
  const status = order.status as OrderStatus;
  return {
    trackingId: order.trackingId,
    customerName: order.customerName,
    device: order.device,
    service: order.service,
    price: order.price,
    status: order.status,
    statusDescription:
      ORDER_STATUS_DESCRIPTIONS[status] ?? "Status update pending.",
    etaDays: order.etaDays,
    updates: (order.updates ?? []).map((u: Record<string, any>) => ({
      status: u.status,
      note: u.note ?? "",
      at: new Date(u.at).toISOString(),
    })),
  };
}

/**
 * POST /api/repair-status — visitors check the status of a repair order
 * by entering the tracking ID they received.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trackingId =
      typeof body.trackingId === "string"
        ? body.trackingId.trim().toUpperCase()
        : "";

    if (!trackingId) {
      return NextResponse.json(
        { ok: false, error: "A tracking ID is required." },
        { status: 400 }
      );
    }

    await connectDB();
    const order = await RepairOrder.findOne({ trackingId }).lean().exec();

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          error: "No repair order found with that tracking ID.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order: serializeOrder(order) });
  } catch (err) {
    console.error("[api POST /api/repair-status]", err);
    return NextResponse.json(
      { ok: false, error: "Could not fetch repair status." },
      { status: 500 }
    );
  }
}