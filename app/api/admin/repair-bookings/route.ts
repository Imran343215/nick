import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import RepairBooking from "@/models/RepairBooking";

export const dynamic = "force-dynamic";

type BookingDocLike = {
  _id: unknown;
  bookingNumber?: string;
  trackingId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  brandName?: string;
  deviceName?: string;
  services?: unknown[];
  subtotal?: number;
  couponCode?: string;
  couponDiscount?: number;
  total?: number;
  savings?: number;
  addressLabel?: string;
  addressLine?: string;
  addressCity?: string;
  addressPostcode?: string;
  pickupDate?: Date | string | null;
  repairMode?: string;
  customMessage?: string;
  status?: string;
  createdAt?: Date | string | null;
};

function serializeBooking(doc: BookingDocLike) {
  return {
    _id: String(doc._id),
    bookingNumber: doc.bookingNumber as string,
    trackingId: doc.trackingId as string,
    customerName: doc.customerName as string,
    customerEmail: doc.customerEmail as string,
    customerPhone: doc.customerPhone as string,
    brandName: doc.brandName as string,
    deviceName: doc.deviceName as string,
    services: doc.services as unknown[],
    subtotal: doc.subtotal as number,
    couponCode: doc.couponCode as string | undefined,
    couponDiscount: doc.couponDiscount as number,
    total: doc.total as number,
    savings: doc.savings as number,
    addressLabel: doc.addressLabel as string | undefined,
    addressLine: doc.addressLine as string,
    addressCity: doc.addressCity as string,
    addressPostcode: doc.addressPostcode as string,
    pickupDate: doc.pickupDate ? new Date(doc.pickupDate).toISOString() : null,
    repairMode: doc.repairMode as string,
    customMessage: doc.customMessage as string | undefined,
    status: doc.status as string,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/** GET /api/admin/repair-bookings */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const bookings = await RepairBooking.find().sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json({ ok: true, bookings: bookings.map(serializeBooking) });
  } catch (err) {
    console.error("[api GET /api/admin/repair-bookings]", err);
    return NextResponse.json({ ok: false, error: "Could not load bookings." }, { status: 500 });
  }
}
