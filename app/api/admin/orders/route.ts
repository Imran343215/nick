import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

function toJSON(o: Record<string, any>) {
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    clerkUserId: o.clerkUserId ?? "",
    productId: o.productId ? String(o.productId) : "",
    productName: o.productName,
    quantity: o.quantity,
    unitPrice: o.unitPrice,
    total: o.total,
    currency: o.currency ?? "gbp",
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    shippingAddress: o.shippingAddress ?? "",
    shippingCarrier: o.shippingCarrier ?? "",
    shippingNumber: o.shippingNumber ?? "",
    paymentStatus: o.paymentStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  };
}

/** GET /api/admin/orders — list all store orders (admin). */
export async function GET() {
  if (!(await isAdminAuthed()))
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean().exec();
    return NextResponse.json({ ok: true, count: orders.length, orders: orders.map(toJSON) });
  } catch (err) {
    console.error("[api GET /api/admin/orders]", err);
    return NextResponse.json({ ok: false, error: "Could not load orders." }, { status: 500 });
  }
}