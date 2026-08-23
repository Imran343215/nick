import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import { serializeProduct } from "@/lib/products";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { clean, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

function adminRequired() {
  return isAdminAuthed();
}

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ active: true })
      .sort({ featured: -1, createdAt: -1 })
      .lean()
      .exec();
    return NextResponse.json({ ok: true, products: products.map(serializeProduct) });
  } catch (err) {
    console.error("[api GET /api/products]", err);
    return NextResponse.json({ ok: false, error: "Could not load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await adminRequired())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = clean(body.name);
    const description = clean(body.description);
    const imageUrl = clean(body.imageUrl);
    const category = clean(body.category);
    const condition = body.condition === "second-hand" ? "second-hand" : "new";
    const price = Number(body.price);
    const stock = Number(body.stock);
    if (!name || !description || !imageUrl || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ ok: false, error: "Name, description, image, valid price and stock are required." }, { status: 400 });
    }

    await connectDB();
    if (category) {
      // The admin form sends the category's display name; match by name with
      // slug as a fallback so both formats are accepted.
      const foundCategory = await Category.findOne({
        $or: [{ name: category }, { slug: category }],
      })
        .lean()
        .exec();
      if (!foundCategory) {
        return NextResponse.json({ ok: false, error: "Selected category does not exist." }, { status: 400 });
      }
    }
    const baseSlug = slugify(name) || `product-${Date.now()}`;
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    const product = await Product.create({
      name,
      slug,
      description,
      category,
      condition,
      price,
      currency: "gbp",
      imageUrl,
      imagePublicId: clean(body.imagePublicId),
      stock,
      active: body.active !== false,
      featured: body.featured === true,
    });
    return NextResponse.json({ ok: true, product: serializeProduct(product.toObject()) }, { status: 201 });
  } catch (err) {
    console.error("[api POST /api/products]", err);
    return NextResponse.json({ ok: false, error: "Could not create product." }, { status: 500 });
  }
}