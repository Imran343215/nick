import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { jsonWithCors, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    await connectDB();
    const product = await Product.findOne({ slug, active: true }).lean().exec();
    if (!product) {
      return jsonWithCors({ ok: false, error: "Product not found." }, { status: 404 });
    }
    return jsonWithCors({ ok: true, product: serializeProduct(product) });
  } catch (err) {
    console.error("[api GET /api/products/:slug]", err);
    return jsonWithCors({ ok: false, error: "Could not load product." }, { status: 500 });
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