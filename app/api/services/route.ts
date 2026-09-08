import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";
import { jsonWithCors, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const services = await Service.find()
      .sort({ featured: -1, priceFrom: 1 })
      .lean()
      .exec();

    return jsonWithCors({
      ok: true,
      count: services.length,
      services: services.map((d: any) => ({
        _id: String(d._id),
        name: d.name,
        slug: d.slug,
        description: d.description,
        category: d.category,
        priceFrom: d.priceFrom,
        turnaroundDays: d.turnaroundDays,
        icon: d.icon,
        featured: d.featured,
      })),
    });
  } catch (err) {
    console.error("[api GET /api/services]", err);
    return jsonWithCors(
      { ok: false, error: "Could not load services. Check the MongoDB connection." },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}