import { isAdminAuthed } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ServiceTemplate from "@/models/ServiceTemplate";
import { autoSlugFromName, uploadCatalogImage } from "@/lib/upload";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET all service templates
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const templates = await ServiceTemplate.find()
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[API] could not load service templates:", error);
    return NextResponse.json({ error: "Could not load service templates" }, { status: 500 });
  }
}

// POST create service template
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { name, slug, icon, iconPublicId, status, order } = body;

    if (!name || !icon) {
      return NextResponse.json({ error: "Name and icon are required" }, { status: 400 });
    }

    const finalSlug = slug || autoSlugFromName(name);

    // Check if slug already exists
    const existing = await ServiceTemplate.findOne({ slug: finalSlug });
    if (existing) {
      return NextResponse.json({ error: "Service template with this slug already exists" }, { status: 400 });
    }

    const template = await ServiceTemplate.create({
      name: name.trim(),
      slug: finalSlug.trim(),
      icon: icon.trim(),
      iconPublicId: iconPublicId?.trim(),
      status: status || "active",
      order: Number(order) || 0,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[API] could not create service template:", error);
    return NextResponse.json({ error: "Could not create service template" }, { status: 500 });
  }
}