import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import RepairAddress from "@/models/RepairAddress";
import { clean } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AddressDocLike = {
  _id: unknown;
  label?: string;
  line1?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  isDefault?: boolean;
};

function serializeAddress(doc: AddressDocLike) {
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

/** GET /api/repair-addresses — list saved addresses for signed-in user */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in to manage addresses." }, { status: 401 });
  }
  try {
    await connectDB();
    const addresses = await RepairAddress.find({ clerkUserId: userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()
      .exec();
    return NextResponse.json({ ok: true, addresses: addresses.map(serializeAddress) });
  } catch (err) {
    console.error("[api GET /api/repair-addresses]", err);
    return NextResponse.json({ ok: false, error: "Could not load addresses." }, { status: 500 });
  }
}

/** POST /api/repair-addresses — save a new address */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in to save addresses." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const label = clean(body.label) || "Home";
    const line1 = clean(body.line1);
    const city = clean(body.city);
    const postcode = clean(body.postcode);
    const phone = clean(body.phone);
    const isDefault = body.isDefault === true;

    if (!line1 || !city || !postcode || !phone) {
      return NextResponse.json(
        { ok: false, error: "Address line, city, postcode, and phone are required." },
        { status: 400 }
      );
    }

    await connectDB();
    if (isDefault) {
      await RepairAddress.updateMany({ clerkUserId: userId }, { isDefault: false }).exec();
    }
    const address = await RepairAddress.create({
      clerkUserId: userId,
      label,
      line1,
      city,
      postcode,
      phone,
      isDefault,
    });
    return NextResponse.json(
      { ok: true, address: serializeAddress(address.toObject()) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/repair-addresses]", err);
    return NextResponse.json({ ok: false, error: "Could not save address." }, { status: 500 });
  }
}
