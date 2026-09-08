import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { clean, slugify } from "@/lib/utils";
import { jsonWithCors, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

function adminRequired() {
  return false; // Public endpoint for RN app
}

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ active: true })
      .sort({ featured: -1, createdAt: -1 })
      .lean()
      .exec();
    return jsonWithCors({ ok: true, products: products.map(serializeProduct) });
  } catch (err) {
    console.error("[api GET /api/products]", err);
    return jsonWithCors({ ok: false, error: "Could not load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') return handleOptions();
  
  if (!(await adminRequired())) {
    return jsonWithCors({ ok: false, error: "Admin authentication required." }, { status: 401 });
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
      return jsonWithCors({ ok: false, error: "Name, description, image, valid price and stock are required." }, { status: 400 });
    }

    await connectDB();
    if (category) {
      const foundCategory = await Category.findOne({
        $or: [{ name: category }, { slug: category }],
      })
        .lean()
        .exec();
      if (!foundCategory) {
        return jsonWithCors({ ok: false, error: "Selected category does not exist." }, { status: 400 });
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
    return jsonWithCors({ ok: true, product: serializeProduct(product.toObject()) }, { status: 201 });
  } catch (err) {
    console.error("[api POST /api/products]", err);
    return jsonWithCors({ ok: false, error: "Could not create product." }, { status: 500 });
  }
}

function serializeProduct(product: Record<string, any>) {
  return {
    _id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description,
    condition: product.condition,
    price: product.price,
    currency: product.currency ?? "gbp",
    imageUrl: product.imageUrl,
    category: product.category ?? "",
    stock: product.stock,
    active: product.active,
    featured: product.featured,
    createdAt: product.createdAt
      ? new Date(product.createdAt).toISOString()
      : undefined,
  };
}