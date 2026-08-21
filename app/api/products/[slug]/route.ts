import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { serializeProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    await connectDB();
    const product = await Product.findOne({ slug, active: true }).lean().exec();
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product: serializeProduct(product) });
  } catch (err) {
    console.error("[api GET /api/products/:slug]", err);
    return NextResponse.json({ ok: false, error: "Could not load product." }, { status: 500 });
  }
}