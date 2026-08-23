import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import RepairAddress from "@/models/RepairAddress";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function serializeAddress(doc: Record<string, unknown>) {
  return {
    _id: String(doc._id),
    label: doc.label as string,
    line1: doc.line1 as string,
    city: doc.city as string,
    postcode: doc.postcode as string,
    phone: doc.phone as string,
    isDefault: Boolean(doc.isDefault),
  };
}

/** PATCH /api/repair-addresses/:id */
export async function PATCH(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();
    const existing = await RepairAddress.findOne({ _id: id, clerkUserId: userId }).exec();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Address not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.label === "string") update.label = clean(body.label) || "Home";
    if (typeof body.line1 === "string") update.line1 = clean(body.line1);
    if (typeof body.city === "string") update.city = clean(body.city);
    if (typeof body.postcode === "string") update.postcode = clean(body.postcode);
    if (typeof body.phone === "string") update.phone = clean(body.phone);
    if (body.isDefault === true) {
      await RepairAddress.updateMany({ clerkUserId: userId }, { isDefault: false }).exec();
      update.isDefault = true;
    }

    const address = await RepairAddress.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    return NextResponse.json({ ok: true, address: serializeAddress(address!) });
  } catch (err) {
    console.error("[api PATCH /api/repair-addresses/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update address." }, { status: 500 });
  }
}

/** DELETE /api/repair-addresses/:id */
export async function DELETE(_request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await RepairAddress.findOneAndDelete({ _id: id, clerkUserId: userId }).exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Address not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/repair-addresses/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete address." }, { status: 500 });
  }
}
