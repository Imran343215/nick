import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import RepairBooking from "@/models/RepairBooking";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const STATUSES = ["new", "confirmed", "scheduled", "in_progress", "completed", "cancelled"];

/** PATCH /api/admin/repair-bookings/:id */
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
    const booking = await RepairBooking.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!booking) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      booking: {
        _id: String(booking._id),
        status: booking.status,
        bookingNumber: booking.bookingNumber,
      },
    });
  } catch (err) {
    console.error("[api PATCH /api/admin/repair-bookings/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update booking." }, { status: 500 });
  }
}

/** DELETE /api/admin/repair-bookings/:id */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await RepairBooking.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/repair-bookings/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete booking." }, { status: 500 });
  }
}
