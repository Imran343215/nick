import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Brand from "@/models/Brand";
import RepairCategory from "@/models/RepairCategory";
import { clean, slugify } from "@/lib/utils";
import { serializeBrand } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

async function uniqueBrandSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Brand.findOne(query).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function resolveCategoryId(value: unknown): Promise<string | null | undefined> {
  if (value === undefined) return undefined;
  const raw = clean(value as string);
  if (!raw) return null;
  await connectDB();
  const exists = await RepairCategory.findById(raw).lean().exec();
  return exists ? raw : null;
}

/** GET /api/admin/brands — list all brands (admin). */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const brands = await Brand.find().populate("category").sort({ order: 1, name: 1 }).lean().exec();
    return NextResponse.json({ ok: true, brands: brands.map((b) => serializeBrand(b)) });
  } catch (err) {
    console.error("[api GET /api/admin/brands]", err);
    return NextResponse.json({ ok: false, error: "Could not load brands." }, { status: 500 });
  }
}

/** POST /api/admin/brands — create a brand (admin). */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = clean(body.name);
    const logo = clean(body.logo);
    const status = body.status === "inactive" ? "inactive" : "active";
    const order = Number(body.order);

    if (!name || !logo) {
      return NextResponse.json(
        { ok: false, error: "Name and logo are required." },
        { status: 400 }
      );
    }

    const categoryId = await resolveCategoryId(body.categoryId);
    if (categoryId === null) {
      return NextResponse.json(
        { ok: false, error: "Selected repair category does not exist." },
        { status: 400 }
      );
    }

    await connectDB();
    const baseSlug = slugify(body.slug || name) || `brand-${Date.now()}`;
    const slug = await uniqueBrandSlug(baseSlug);
    const created = await Brand.create({
      name,
      slug,
      logo,
      logoPublicId: clean(body.logoPublicId),
      category: categoryId ?? undefined,
      status,
      order: Number.isFinite(order) ? order : 0,
    });
    const brand = await Brand.findById(created._id).populate("category").lean().exec();
    return NextResponse.json(
      { ok: true, brand: serializeBrand(brand as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/brands]", err);
    return NextResponse.json({ ok: false, error: "Could not create brand." }, { status: 500 });
  }
}
