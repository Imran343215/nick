import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import SellOrder from "@/models/SellOrder";

export const dynamic = "force-dynamic";

type OrderDocLike = {
  _id: unknown;
  orderNumber?: string;
  trackingId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  brandName?: string;
  deviceName?: string;
  variantLabel?: string;
  basePrice?: number;
  answers?: unknown[];
  finalQuote?: number;
  payoutMethod?: string;
  payoutDetails?: string;
  addressLine?: string;
  addressCity?: string;
  addressPostcode?: string;
  pickupDate?: Date | string | null;
  customMessage?: string;
  status?: string;
  createdAt?: Date | string | null;
};

function serializeOrder(doc: OrderDocLike) {
  return {
    _id: String(doc._id),
    orderNumber: doc.orderNumber as string,
    trackingId: doc.trackingId as string,
    customerName: doc.customerName as string,
    customerEmail: doc.customerEmail as string,
    customerPhone: doc.customerPhone as string,
    brandName: doc.brandName as string,
    deviceName: doc.deviceName as string,
    variantLabel: doc.variantLabel as string,
    basePrice: doc.basePrice as number,
    answers: doc.answers as unknown[],
    finalQuote: doc.finalQuote as number,
    payoutMethod: doc.payoutMethod as string,
    payoutDetails: doc.payoutDetails as string,
    addressLine: doc.addressLine as string,
    addressCity: doc.addressCity as string,
    addressPostcode: doc.addressPostcode as string,
    pickupDate: doc.pickupDate ? new Date(doc.pickupDate).toISOString() : null,
    customMessage: doc.customMessage as string | undefined,
    status: doc.status as string,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/** GET /api/admin/sell-orders */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const orders = await SellOrder.find().sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json({ ok: true, orders: orders.map(serializeOrder) });
  } catch (err) {
    console.error("[api GET /api/admin/sell-orders]", err);
    return NextResponse.json({ ok: false, error: "Could not load sell orders." }, { status: 500 });
  }
}
