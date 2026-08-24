import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RepairBooking from "@/models/RepairBooking";

export const dynamic = "force-dynamic";

const BOOKING_STATUS_DESCRIPTIONS: Record<string, string> = {
  new: "Your repair booking has been received and is awaiting confirmation.",
  confirmed: "Your booking is confirmed — our technician will arrive as scheduled.",
  scheduled: "Your repair visit has been scheduled.",
  in_progress: "Your device is currently being repaired.",
  completed: "Your repair has been completed. Thank you for choosing iTECHNICK.",
  cancelled: "This booking was cancelled.",
};

function serializeBooking(booking: Record<string, any>) {
  const status = booking.status as string;
  return {
    trackingId: booking.trackingId,
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    device: [booking.brandName, booking.deviceName].filter(Boolean).join(" "),
    service: (booking.services ?? [])
      .map((s: Record<string, any>) => s.name)
      .join(", "),
    price: booking.total,
    status,
    statusDescription:
      BOOKING_STATUS_DESCRIPTIONS[status] ?? "Status update pending.",
    pickupDate: booking.pickupDate
      ? new Date(booking.pickupDate).toISOString()
      : undefined,
    updates: [
      {
        status,
        note: `Booking ${booking.bookingNumber} received`,
        at: new Date(booking.updatedAt ?? booking.createdAt).toISOString(),
      },
    ],
  };
}

/**
 * POST /api/repair-status — visitors check the status of a booked repair
 * by entering the tracking ID (or booking number) from their confirmation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code =
      typeof body.trackingId === "string" ? body.trackingId.trim().toUpperCase() : "";

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "A tracking ID is required." },
        { status: 400 }
      );
    }

    await connectDB();
    const booking = await RepairBooking.findOne({
      $or: [{ trackingId: code }, { bookingNumber: code }],
    })
      .lean()
      .exec();

    if (!booking) {
      return NextResponse.json(
        {
          ok: false,
          error: "No repair booking found with that tracking ID.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order: serializeBooking(booking) });
  } catch (err) {
    console.error("[api POST /api/repair-status]", err);
    return NextResponse.json(
      { ok: false, error: "Could not fetch repair status." },
      { status: 500 }
    );
  }
}