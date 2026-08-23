import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Device from "@/models/Device";
import RepairService from "@/models/RepairService";
import ServiceTemplate from "@/models/ServiceTemplate";
import { clean, slugify } from "@/lib/utils";
import { serializeRepairService, type Doc } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function uniqueServiceSlug(
  deviceId: string,
  base: string,
  excludeId: string
): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await RepairService.findOne({
      device: deviceId,
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

/** PATCH /api/admin/repair-services/:id — update a repair service (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const existing = await RepairService.findById(id).lean().exec();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Repair service not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    const deviceId = clean(body.device) || String(existing.device);
    if (clean(body.device)) update.device = deviceId;
    if (clean(body.serviceTemplate)) update.serviceTemplate = clean(body.serviceTemplate);
    if (typeof body.name === "string" && clean(body.name)) update.name = clean(body.name);
    if (typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0) {
      update.price = body.price;
    }
    if (body.discountPrice === null || body.discountPrice === "") {
      update.discountPrice = undefined;
    } else if (
      typeof body.discountPrice === "number" &&
      Number.isFinite(body.discountPrice) &&
      body.discountPrice >= 0
    ) {
      update.discountPrice = body.discountPrice;
    }
    if (typeof body.estimatedTime === "string") {
      update.estimatedTime = clean(body.estimatedTime) || undefined;
    }
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (typeof body.order === "number" && Number.isFinite(body.order)) update.order = body.order;

    if (typeof body.slug === "string" && clean(body.slug)) {
      update.slug = await uniqueServiceSlug(deviceId, slugify(body.slug), id);
    } else if (update.name && typeof update.name === "string") {
      update.slug = await uniqueServiceSlug(deviceId, slugify(update.name as string), id);
    }

    const service = await RepairService.findByIdAndUpdate(id, update, { new: true })
      .populate({
        path: "device",
        select: "name slug brand",
        populate: { path: "brand", select: "name slug" },
      })
      .populate("serviceTemplate")
      .lean()
      .exec();
    if (!service) {
      return NextResponse.json({ ok: false, error: "Repair service not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      service: serializeRepairService(service, service.device as Doc, service.serviceTemplate as Doc),
    });
  } catch (err) {
    console.error("[api PATCH /api/admin/repair-services/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update repair service." }, { status: 500 });
  }
}

/** DELETE /api/admin/repair-services/:id — remove a repair service (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await RepairService.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Repair service not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/repair-services/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete repair service." }, { status: 500 });
  }
}
