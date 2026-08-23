import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Category from "@/models/Category";
import { clean, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

function serializeCategory(c: Record<string, any>) {
  return {
    _id: String(c._id),
    name: c.name,
    slug: c.slug,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
  };
}

/** GET /api/admin/categories — list all categories (admin). */
export async function GET() {
  if (!(await isAdminAuthed()))
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean().exec();
    return NextResponse.json({ ok: true, categories: categories.map(serializeCategory) });
  } catch (err) {
    console.error("[api GET /api/admin/categories]", err);
    return NextResponse.json({ ok: false, error: "Could not load categories." }, { status: 500 });
  }
}

/** POST /api/admin/categories — create a category (admin). */
export async function POST(request: Request) {
  if (!(await isAdminAuthed()))
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    const body = await request.json();
    const name = clean(body.name);
    if (!name)
      return NextResponse.json({ ok: false, error: "Category name is required." }, { status: 400 });

    await connectDB();
    const slug = slugify(name) || `cat-${Date.now()}`;
    const existing = await Category.findOne({ $or: [{ name }, { slug }] }).lean().exec();
    if (existing)
      return NextResponse.json({ ok: false, error: "A category with this name already exists." }, { status: 409 });

    const category = await Category.create({ name, slug });
    return NextResponse.json({ ok: true, category: serializeCategory(category.toObject()) }, { status: 201 });
  } catch (err) {
    console.error("[api POST /api/admin/categories]", err);
    return NextResponse.json({ ok: false, error: "Could not create category." }, { status: 500 });
  }
}