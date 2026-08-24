import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import RepairCategory from "@/models/RepairCategory";
import { clean, slugify } from "@/lib/utils";
import { serializeCategory } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

async function uniqueCategorySlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await RepairCategory.findOne({ slug }).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** GET /api/admin/repair-categories — list all repair categories (admin). */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const categories = await RepairCategory.find().sort({ order: 1, name: 1 }).lean().exec();
    return NextResponse.json({ ok: true, categories: categories.map(serializeCategory) });
  } catch (err) {
    console.error("[api GET /api/admin/repair-categories]", err);
    return NextResponse.json({ ok: false, error: "Could not load categories." }, { status: 500 });
  }
}

/** POST /api/admin/repair-categories — create a repair category (admin). */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = clean(body.name);
    const icon = clean(body.icon);
    const status = body.status === "inactive" ? "inactive" : "active";
    const order = Number(body.order);

    if (!name || !icon) {
      return NextResponse.json(
        { ok: false, error: "Name and icon are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const baseSlug = slugify(body.slug || name) || `category-${Date.now()}`;
    const slug = await uniqueCategorySlug(baseSlug);
    const category = await RepairCategory.create({
      name,
      slug,
      icon,
      iconPublicId: clean(body.iconPublicId),
      status,
      order: Number.isFinite(order) ? order : 0,
    });
    return NextResponse.json(
      { ok: true, category: serializeCategory(category.toObject()) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/repair-categories]", err);
    return NextResponse.json({ ok: false, error: "Could not create category." }, { status: 500 });
  }
}