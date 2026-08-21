import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RepairOrder, {
  ORDER_STATUS_DESCRIPTIONS,
  type OrderStatus,
} from "@/models/RepairOrder";
import RepairQuery from "@/models/RepairQuery";

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

const QUERY_STATUS_DESCRIPTIONS: Record<string, string> = {
  new: "Your repair request has been received and is awaiting review.",
  contacted: "Our team has contacted you about your repair request.",
  quoted: "Your repair request has been reviewed and a quote is available.",
  completed: "Your repair request has been completed.",
  closed: "This repair request is closed.",
};

function serializeQuery(query: Record<string, any>) {
  return {
    trackingId: query.trackingId,
    customerName: query.name,
    device: [query.deviceBrand, query.deviceModel].filter(Boolean).join(" "),
    service: query.issue,
    status: query.status,
    statusDescription:
      QUERY_STATUS_DESCRIPTIONS[query.status] ?? "Status update pending.",
    updates: [
      {
        status: query.status,
        note: "Repair request status",
        at: new Date(query.updatedAt ?? query.createdAt).toISOString(),
      },
    ],
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

    if (order) {
      return NextResponse.json({ ok: true, order: serializeOrder(order) });
    }

    const query = await RepairQuery.findOne({ trackingId }).lean().exec();
    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "No repair order found with that tracking ID.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order: serializeQuery(query) });
  } catch (err) {
    console.error("[api POST /api/repair-status]", err);
    return NextResponse.json(
      { ok: false, error: "Could not fetch repair status." },
      { status: 500 }
    );
  }
}