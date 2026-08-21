import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import { serializeProduct } from "@/lib/products";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json({ ok: true, products: products.map(serializeProduct) });
  } catch (err) {
    console.error("[api GET /api/admin/products]", err);
    return NextResponse.json({ ok: false, error: "Could not load products." }, { status: 500 });
  }
}