import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Brand from "@/models/Brand";
import Device from "@/models/Device";
import { clean, slugify } from "@/lib/utils";
import { serializeDevice, type Doc } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

async function uniqueDeviceSlug(
  brandId: string,
  base: string,
  excludeId?: string
): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const query: Record<string, unknown> = { brand: brandId, slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Device.findOne(query).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** GET /api/admin/devices?brandId=xxx — list devices (admin). */
export async function GET(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const brandId = clean(searchParams.get("brandId"));
    await connectDB();
    const filter = brandId ? { brand: brandId } : {};
    const devices = await Device.find(filter)
      .populate("brand", "name slug")
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return NextResponse.json({
      ok: true,
      devices: devices.map((doc) =>
        serializeDevice(doc, doc.brand as Doc)
      ),
    });
  } catch (err) {
    console.error("[api GET /api/admin/devices]", err);
    return NextResponse.json({ ok: false, error: "Could not load devices." }, { status: 500 });
  }
}

/** POST /api/admin/devices — create a device (admin). */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const brandId = clean(body.brand);
    const name = clean(body.name);
    const image = clean(body.image);
    const status = body.status === "inactive" ? "inactive" : "active";
    const order = Number(body.order);

    if (!brandId || !name || !image) {
      return NextResponse.json(
        { ok: false, error: "Brand, name, and image are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const brand = await Brand.findById(brandId).lean().exec();
    if (!brand) {
      return NextResponse.json({ ok: false, error: "Selected brand does not exist." }, { status: 400 });
    }

    const baseSlug = slugify(body.slug || name) || `device-${Date.now()}`;
    const slug = await uniqueDeviceSlug(brandId, baseSlug);
    const device = await Device.create({
      brand: brandId,
      name,
      slug,
      image,
      imagePublicId: clean(body.imagePublicId),
      status,
      order: Number.isFinite(order) ? order : 0,
    });
    const populated = await Device.findById(device._id)
      .populate("brand", "name slug")
      .lean()
      .exec();
    return NextResponse.json(
      {
        ok: true,
        device: serializeDevice(
          populated as Doc,
          populated?.brand as Doc
        ),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/devices]", err);
    return NextResponse.json({ ok: false, error: "Could not create device." }, { status: 500 });
  }
}
