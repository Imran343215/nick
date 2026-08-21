import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`invalidate=true&public_id=${publicId}&timestamp=${timestamp}&type=upload${apiSecret}`)
    .digest("hex");
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    type: "upload",
    invalidate: "true",
    api_key: apiKey,
    signature,
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = await response.json() as { result?: string; error?: { message?: string } };
  if (!response.ok || (result.result !== "ok" && result.result !== "not found")) {
    throw new Error(result.error?.message || "Cloudinary image deletion failed.");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.stock === "number" && Number.isInteger(body.stock) && body.stock >= 0) update.stock = body.stock;
    if (typeof body.active === "boolean") update.active = body.active;
    if (typeof body.featured === "boolean") update.featured = body.featured;
    const product = await Product.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!product) return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("[api PATCH /api/admin/products/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    const { id } = await params;
    await connectDB();
    const product = await Product.findById(id).lean().exec();
    if (!product) return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });

    if (product.imagePublicId) await deleteCloudinaryImage(product.imagePublicId);
    await Product.findByIdAndDelete(id).exec();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/products/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete product." }, { status: 500 });
  }
}