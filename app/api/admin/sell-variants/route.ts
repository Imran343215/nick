import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Device from "@/models/Device";
import SellVariant from "@/models/SellVariant";
import { clean, slugify } from "@/lib/utils";
import { serializeSellVariant, type Doc } from "@/lib/sell-catalog";

export const dynamic = "force-dynamic";

async function uniqueVariantSlug(deviceId: string, base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const query: Record<string, unknown> = { device: deviceId, slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await SellVariant.findOne(query).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** GET /api/admin/sell-variants?deviceId=xxx — list sell variants (admin). */
export async function GET(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = clean(searchParams.get("deviceId"));
    await connectDB();
    const filter = deviceId ? { device: deviceId } : {};
    const variants = await SellVariant.find(filter)
      .populate({
        path: "device",
        select: "name slug brand",
        populate: { path: "brand", select: "name slug" },
      })
      .sort({ order: 1, label: 1 })
      .lean()
      .exec();
    return NextResponse.json({
      ok: true,
      variants: variants.map((doc) => serializeSellVariant(doc, doc.device as Doc)),
    });
  } catch (err) {
    console.error("[api GET /api/admin/sell-variants]", err);
    return NextResponse.json({ ok: false, error: "Could not load sell variants." }, { status: 500 });
  }
}

/** POST /api/admin/sell-variants — create a sell variant (admin). */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const deviceId = clean(body.device);
    const label = clean(body.label);
    const basePrice = Number(body.basePrice);
    const status = body.status === "inactive" ? "inactive" : "active";
    const order = Number(body.order);

    if (!deviceId || !label || !Number.isFinite(basePrice) || basePrice < 0) {
      return NextResponse.json(
        { ok: false, error: "Device, label, and a valid base price are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const device = await Device.findById(deviceId).lean().exec();
    if (!device) {
      return NextResponse.json({ ok: false, error: "Selected device does not exist." }, { status: 400 });
    }

    const baseSlug = slugify(body.slug || label) || `variant-${Date.now()}`;
    const slug = await uniqueVariantSlug(deviceId, baseSlug);
    const variant = await SellVariant.create({
      device: deviceId,
      label,
      slug,
      basePrice,
      status,
      order: Number.isFinite(order) ? order : 0,
    });
    const populated = await SellVariant.findById(variant._id)
      .populate({
        path: "device",
        select: "name slug brand",
        populate: { path: "brand", select: "name slug" },
      })
      .lean()
      .exec();
    return NextResponse.json(
      { ok: true, variant: serializeSellVariant(populated as Doc, populated?.device as Doc) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/sell-variants]", err);
    return NextResponse.json({ ok: false, error: "Could not create sell variant." }, { status: 500 });
  }
}
