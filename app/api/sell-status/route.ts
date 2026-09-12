import { connectDB } from "@/lib/db";
import SellOrder from "@/models/SellOrder";
import { jsonWithCors, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

const ORDER_STATUS_DESCRIPTIONS: Record<string, string> = {
  new: "Your sell request has been received and is awaiting pickup scheduling.",
  pickup_scheduled: "Pickup has been scheduled for your device.",
  picked_up: "Your device has been collected and is on its way for inspection.",
  inspected: "Your device has been inspected — payout is being processed.",
  paid: "Payout complete. Thank you for selling with us.",
  rejected: "This sell request was rejected after inspection. Our team will contact you.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeOrder(order: Record<string, any>) {
  const status = order.status as string;
  return {
    trackingId: order.trackingId,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    device: [order.brandName, order.deviceName, order.variantLabel].filter(Boolean).join(" "),
    quote: order.finalQuote,
    status,
    statusDescription: ORDER_STATUS_DESCRIPTIONS[status] ?? "Status update pending.",
    pickupDate: order.pickupDate ? new Date(order.pickupDate).toISOString() : undefined,
    updates: [
      {
        status,
        note: `Sell request ${order.orderNumber} received`,
        at: new Date(order.updatedAt ?? order.createdAt).toISOString(),
      },
    ],
  };
}

export async function OPTIONS() {
  return handleOptions();
}

/** POST /api/sell-status — visitors check the status of a sell request by tracking ID. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body.trackingId === "string" ? body.trackingId.trim().toUpperCase() : "";

    if (!code) {
      return jsonWithCors({ ok: false, error: "A tracking ID is required." }, { status: 400 });
    }

    await connectDB();
    const order = await SellOrder.findOne({
      $or: [{ trackingId: code }, { orderNumber: code }],
    })
      .lean()
      .exec();

    if (!order) {
      return jsonWithCors(
        { ok: false, error: "No sell request found with that tracking ID." },
        { status: 404 }
      );
    }

    return jsonWithCors({ ok: true, order: serializeOrder(order) });
  } catch (err) {
    console.error("[api POST /api/sell-status]", err);
    return jsonWithCors({ ok: false, error: "Could not fetch sell request status." }, { status: 500 });
  }
}
