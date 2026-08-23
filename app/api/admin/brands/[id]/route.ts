import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Brand from "@/models/Brand";
import Device from "@/models/Device";
import { clean, slugify } from "@/lib/utils";
import { serializeBrand } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function uniqueBrandSlug(base: string, excludeId: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await Brand.findOne({ slug, _id: { $ne: excludeId } }).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** PATCH /api/admin/brands/:id — update a brand (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};
    if (typeof body.name === "string" && clean(body.name)) update.name = clean(body.name);
    if (typeof body.logo === "string" && clean(body.logo)) {
      update.logo = clean(body.logo);
      update.logoPublicId = clean(body.logoPublicId);
    }
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (typeof body.order === "number" && Number.isFinite(body.order)) update.order = body.order;
    if (typeof body.slug === "string" && clean(body.slug)) {
      update.slug = await uniqueBrandSlug(slugify(body.slug), id);
    } else if (update.name && typeof update.name === "string") {
      update.slug = await uniqueBrandSlug(slugify(update.name), id);
    }

    const brand = await Brand.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!brand) {
      return NextResponse.json({ ok: false, error: "Brand not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, brand: serializeBrand(brand) });
  } catch (err) {
    console.error("[api PATCH /api/admin/brands/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update brand." }, { status: 500 });
  }
}

/** DELETE /api/admin/brands/:id — remove a brand (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deviceCount = await Device.countDocuments({ brand: id }).exec();
    if (deviceCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot delete brand — ${deviceCount} device(s) still linked. Remove them first.`,
        },
        { status: 400 }
      );
    }
    const deleted = await Brand.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Brand not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/brands/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete brand." }, { status: 500 });
  }
}
