import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const services = await Service.find()
      .sort({ featured: -1, priceFrom: 1 })
      .lean()
      .exec();

    return NextResponse.json({
      ok: true,
      count: services.length,
      services,
    });
  } catch (err) {
    console.error("[api GET /api/services]", err);
    return NextResponse.json(
      { ok: false, error: "Could not load services. Check the MongoDB connection." },
      { status: 500 }
    );
  }
}