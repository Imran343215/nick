import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import SellVariant from "@/models/SellVariant";
import { clean, slugify } from "@/lib/utils";
import { serializeSellVariant, type Doc } from "@/lib/sell-catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function uniqueVariantSlug(deviceId: string, base: string, excludeId: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await SellVariant.findOne({ device: deviceId, slug, _id: { $ne: excludeId } })
      .lean()
      .exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** PATCH /api/admin/sell-variants/:id — update a sell variant (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const existing = await SellVariant.findById(id).lean().exec();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Sell variant not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    const deviceId = clean(body.device) || String(existing.device);
    if (clean(body.device)) update.device = deviceId;
    if (typeof body.label === "string" && clean(body.label)) update.label = clean(body.label);
    if (typeof body.basePrice === "number" && Number.isFinite(body.basePrice) && body.basePrice >= 0) {
      update.basePrice = body.basePrice;
    }
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (typeof body.order === "number" && Number.isFinite(body.order)) update.order = body.order;

    if (typeof body.slug === "string" && clean(body.slug)) {
      update.slug = await uniqueVariantSlug(deviceId, slugify(body.slug), id);
    } else if (update.label && typeof update.label === "string") {
      update.slug = await uniqueVariantSlug(deviceId, slugify(update.label as string), id);
    }

    const variant = await SellVariant.findByIdAndUpdate(id, update, { new: true })
      .populate({
        path: "device",
        select: "name slug brand",
        populate: { path: "brand", select: "name slug" },
      })
      .lean()
      .exec();
    if (!variant) {
      return NextResponse.json({ ok: false, error: "Sell variant not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      variant: serializeSellVariant(variant, variant.device as Doc),
    });
  } catch (err) {
    console.error("[api PATCH /api/admin/sell-variants/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update sell variant." }, { status: 500 });
  }
}

/** DELETE /api/admin/sell-variants/:id — remove a sell variant (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await SellVariant.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Sell variant not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/sell-variants/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete sell variant." }, { status: 500 });
  }
}
