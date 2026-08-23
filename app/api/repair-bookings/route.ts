import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import RepairBooking from "@/models/RepairBooking";
import { validateRepairCoupon } from "@/lib/repair-coupons";
import { clean, generateTrackingId, validateEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";

function bookingNumber(): string {
  const random = [...crypto.getRandomValues(new Uint8Array(4))]
    .map((b) => b.toString(36).toUpperCase())
    .join("");
  return `RB-${random}`;
}

type BookingDocLike = {
  _id: unknown;
  bookingNumber?: string;
  trackingId?: string;
  customerName?: string;
  customerEmail?: string;
  brandName?: string;
  deviceName?: string;
  total?: number;
  status?: string;
  pickupDate?: Date | string | null;
  createdAt?: Date | string | null;
};

function serializeBooking(doc: BookingDocLike) {
  return {
    _id: String(doc._id),
    bookingNumber: doc.bookingNumber as string,
    trackingId: doc.trackingId as string,
    customerName: doc.customerName as string,
    customerEmail: doc.customerEmail as string,
    brandName: doc.brandName as string,
    deviceName: doc.deviceName as string,
    total: doc.total as number,
    status: doc.status as string,
    pickupDate: doc.pickupDate ? new Date(doc.pickupDate).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/** POST /api/repair-bookings — place a repair booking */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = await auth();
    const user = userId ? await currentUser() : null;

    const customerName = clean(body.customerName) || user?.fullName || "";
    const customerEmail =
      clean(body.customerEmail).toLowerCase() ||
      user?.primaryEmailAddress?.emailAddress?.toLowerCase() ||
      "";
    const customerPhone = clean(body.customerPhone);
    const brandName = clean(body.brandName);
    const deviceName = clean(body.deviceName);
    const brandSlug = clean(body.brandSlug);
    const deviceSlug = clean(body.deviceSlug);
    const addressLabel = clean(body.addressLabel);
    const addressLine = clean(body.addressLine);
    const addressCity = clean(body.addressCity);
    const addressPostcode = clean(body.addressPostcode);
    const pickupDateRaw = clean(body.pickupDate);
    const repairMode = body.repairMode === "store" ? "store" : "home";
    const customMessage = clean(body.customMessage);
    const agreedToTerms = body.agreedToTerms === true;
    const couponCode = clean(body.couponCode).toUpperCase();
    const services = Array.isArray(body.services) ? body.services : [];

    if (!customerName || !validateEmail(customerEmail) || !customerPhone) {
      return NextResponse.json(
        { ok: false, error: "Name, valid email, and phone are required." },
        { status: 400 }
      );
    }
    if (!brandName || !deviceName || !brandSlug || !deviceSlug) {
      return NextResponse.json({ ok: false, error: "Device information is missing." }, { status: 400 });
    }
    if (!addressLine || !addressCity || !addressPostcode) {
      return NextResponse.json({ ok: false, error: "Complete address is required." }, { status: 400 });
    }
    if (!pickupDateRaw) {
      return NextResponse.json({ ok: false, error: "Pickup date is required." }, { status: 400 });
    }
    if (!agreedToTerms) {
      return NextResponse.json({ ok: false, error: "You must agree to the terms." }, { status: 400 });
    }
    if (services.length === 0) {
      return NextResponse.json({ ok: false, error: "Select at least one repair service." }, { status: 400 });
    }

    const normalizedServices = services.map((s: Record<string, unknown>) => ({
      serviceId: String(s.serviceId),
      name: clean(s.name),
      price: Number(s.price),
      discountPrice: s.discountPrice != null ? Number(s.discountPrice) : undefined,
      lineTotal: Number(s.lineTotal),
    }));

    if (
      normalizedServices.some(
        (s: { name: string; lineTotal: number }) => !s.name || !Number.isFinite(s.lineTotal)
      )
    ) {
      return NextResponse.json({ ok: false, error: "Invalid service data." }, { status: 400 });
    }

    const subtotal = normalizedServices.reduce(
      (sum: number, s: { lineTotal: number }) => sum + s.lineTotal,
      0
    );
    const originalTotal = normalizedServices.reduce(
      (sum: number, s: { price: number }) => sum + s.price,
      0
    );

    let couponDiscount = 0;
    if (couponCode) {
      const couponResult = await validateRepairCoupon(couponCode, subtotal);
      if (!couponResult.ok) {
        return NextResponse.json({ ok: false, error: couponResult.error }, { status: 400 });
      }
      couponDiscount = couponResult.discount ?? 0;
    }

    const total = Math.max(0, subtotal - couponDiscount);
    const itemSavings = normalizedServices.reduce(
      (sum: number, s: { price: number; lineTotal: number }) =>
        sum + Math.max(0, s.price - s.lineTotal),
      0
    );
    const savings = itemSavings + couponDiscount;

    const pickupDate = new Date(pickupDateRaw);
    if (Number.isNaN(pickupDate.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid pickup date." }, { status: 400 });
    }

    await connectDB();
    const booking = await RepairBooking.create({
      bookingNumber: bookingNumber(),
      trackingId: generateTrackingId("RB"),
      clerkUserId: userId ?? undefined,
      customerName,
      customerEmail,
      customerPhone,
      brandName,
      deviceName,
      brandSlug,
      deviceSlug,
      deviceImage: clean(body.deviceImage),
      services: normalizedServices,
      subtotal,
      couponCode: couponCode || undefined,
      couponDiscount,
      total,
      savings,
      addressLabel: addressLabel || undefined,
      addressLine,
      addressCity,
      addressPostcode,
      pickupDate,
      repairMode,
      customMessage: customMessage || undefined,
      status: "new",
      agreedToTerms,
    });

    return NextResponse.json(
      { ok: true, booking: serializeBooking(booking.toObject()) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/repair-bookings]", err);
    return NextResponse.json({ ok: false, error: "Could not place booking." }, { status: 500 });
  }
}
