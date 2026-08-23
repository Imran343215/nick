import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Device from "@/models/Device";
import RepairService from "@/models/RepairService";
import { clean, slugify } from "@/lib/utils";
import { serializeDevice, type Doc } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function uniqueDeviceSlug(
  brandId: string,
  base: string,
  excludeId: string
): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await Device.findOne({
      brand: brandId,
      slug,
      _id: { $ne: excludeId },
    })
      .lean()
      .exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** PATCH /api/admin/devices/:id — update a device (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const existing = await Device.findById(id).lean().exec();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Device not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    const brandId = clean(body.brand) || String(existing.brand);
    if (clean(body.brand)) update.brand = brandId;
    if (typeof body.name === "string" && clean(body.name)) update.name = clean(body.name);
    if (typeof body.image === "string" && clean(body.image)) {
      update.image = clean(body.image);
      update.imagePublicId = clean(body.imagePublicId);
    }
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (typeof body.order === "number" && Number.isFinite(body.order)) update.order = body.order;

    if (typeof body.slug === "string" && clean(body.slug)) {
      update.slug = await uniqueDeviceSlug(brandId, slugify(body.slug), id);
    } else if (update.name && typeof update.name === "string") {
      update.slug = await uniqueDeviceSlug(brandId, slugify(update.name as string), id);
    }

    const device = await Device.findByIdAndUpdate(id, update, { new: true })
      .populate("brand", "name slug")
      .lean()
      .exec();
    if (!device) {
      return NextResponse.json({ ok: false, error: "Device not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      device: serializeDevice(device, device.brand as Doc),
    });
  } catch (err) {
    console.error("[api PATCH /api/admin/devices/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update device." }, { status: 500 });
  }
}

/** DELETE /api/admin/devices/:id — remove a device (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const serviceCount = await RepairService.countDocuments({ device: id }).exec();
    if (serviceCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot delete device — ${serviceCount} service(s) still linked. Remove them first.`,
        },
        { status: 400 }
      );
    }
    const deleted = await Device.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Device not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/devices/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete device." }, { status: 500 });
  }
}
