import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import RepairCategory from "@/models/RepairCategory";
import Brand from "@/models/Brand";
import { clean, slugify } from "@/lib/utils";
import { serializeCategory } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function uniqueCategorySlug(base: string, excludeId: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await RepairCategory.findOne({ slug, _id: { $ne: excludeId } }).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** PATCH /api/admin/repair-categories/:id — update a repair category (admin). */
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
    if (typeof body.icon === "string" && clean(body.icon)) {
      update.icon = clean(body.icon);
      update.iconPublicId = clean(body.iconPublicId);
    }
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (typeof body.order === "number" && Number.isFinite(body.order)) update.order = body.order;
    if (typeof body.slug === "string" && clean(body.slug)) {
      update.slug = await uniqueCategorySlug(slugify(body.slug), id);
    } else if (update.name && typeof update.name === "string") {
      update.slug = await uniqueCategorySlug(slugify(update.name), id);
    }

    const category = await RepairCategory.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!category) {
      return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, category: serializeCategory(category) });
  } catch (err) {
    console.error("[api PATCH /api/admin/repair-categories/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update category." }, { status: 500 });
  }
}

/** DELETE /api/admin/repair-categories/:id — remove a repair category (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const brandCount = await Brand.countDocuments({ category: id }).exec();
    if (brandCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot delete category — ${brandCount} brand(s) still linked. Reassign them first.`,
        },
        { status: 400 }
      );
    }
    const deleted = await RepairCategory.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/repair-categories/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete category." }, { status: 500 });
  }
}