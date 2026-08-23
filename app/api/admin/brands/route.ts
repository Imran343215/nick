import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Brand from "@/models/Brand";
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

/** GET /api/admin/brands — list all brands (admin). */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const brands = await Brand.find().sort({ order: 1, name: 1 }).lean().exec();
    return NextResponse.json({ ok: true, brands: brands.map(serializeBrand) });
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

    await connectDB();
    const baseSlug = slugify(body.slug || name) || `brand-${Date.now()}`;
    const slug = await uniqueBrandSlug(baseSlug);
    const brand = await Brand.create({
      name,
      slug,
      logo,
      logoPublicId: clean(body.logoPublicId),
      status,
      order: Number.isFinite(order) ? order : 0,
    });
    return NextResponse.json(
      { ok: true, brand: serializeBrand(brand.toObject()) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/brands]", err);
    return NextResponse.json({ ok: false, error: "Could not create brand." }, { status: 500 });
  }
}
