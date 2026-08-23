import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Device from "@/models/Device";
import RepairService from "@/models/RepairService";
import ServiceTemplate from "@/models/ServiceTemplate";
import { clean, slugify } from "@/lib/utils";
import { serializeRepairService, type Doc } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

async function uniqueServiceSlug(
  deviceId: string,
  base: string,
  excludeId?: string
): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const query: Record<string, unknown> = { device: deviceId, slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await RepairService.findOne(query).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** GET /api/admin/repair-services?deviceId=xxx — list repair services (admin). */
export async function GET(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = clean(searchParams.get("deviceId"));
    await connectDB();
    const filter = deviceId ? { device: deviceId } : {};
    const services = await RepairService.find(filter)
      .populate({
        path: "device",
        select: "name slug brand",
        populate: { path: "brand", select: "name slug" },
      })
      .populate("serviceTemplate")
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return NextResponse.json({
      ok: true,
      services: services.map((doc) =>
        serializeRepairService(doc, doc.device as Doc, doc.serviceTemplate as Doc)
      ),
    });
  } catch (err) {
    console.error("[api GET /api/admin/repair-services]", err);
    return NextResponse.json({ ok: false, error: "Could not load repair services." }, { status: 500 });
  }
}

/** POST /api/admin/repair-services — create a repair service (admin). */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const deviceId = clean(body.device);
    const serviceTemplateId = clean(body.serviceTemplate);
    const name = clean(body.name);
    const price = Number(body.price);
    const discountPrice =
      body.discountPrice != null && body.discountPrice !== ""
        ? Number(body.discountPrice)
        : undefined;
    const status = body.status === "inactive" ? "inactive" : "active";
    const order = Number(body.order);

    if (!deviceId || !serviceTemplateId || !name || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { ok: false, error: "Device, service template, name, and a valid price are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const device = await Device.findById(deviceId).lean().exec();
    if (!device) {
      return NextResponse.json({ ok: false, error: "Selected device does not exist." }, { status: 400 });
    }

    const serviceTemplate = await ServiceTemplate.findById(serviceTemplateId).lean().exec();
    if (!serviceTemplate) {
      return NextResponse.json({ ok: false, error: "Selected service template does not exist." }, { status: 400 });
    }

    const baseSlug = slugify(body.slug || name) || `service-${Date.now()}`;
    const slug = await uniqueServiceSlug(deviceId, baseSlug);
    const service = await RepairService.create({
      device: deviceId,
      serviceTemplate: serviceTemplateId,
      name,
      slug,
      price,
      discountPrice:
        discountPrice != null && Number.isFinite(discountPrice) ? discountPrice : undefined,
      estimatedTime: clean(body.estimatedTime) || undefined,
      status,
      order: Number.isFinite(order) ? order : 0,
    });
    const populated = await RepairService.findById(service._id)
      .populate({
        path: "device",
        select: "name slug brand",
        populate: { path: "brand", select: "name slug" },
      })
      .populate("serviceTemplate")
      .lean()
      .exec();
    return NextResponse.json(
      {
        ok: true,
        service: serializeRepairService(
          populated as Doc,
          populated?.device as Doc,
          populated?.serviceTemplate as Doc
        ),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/repair-services]", err);
    return NextResponse.json({ ok: false, error: "Could not create repair service." }, { status: 500 });
  }
}
