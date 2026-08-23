import { isAdminAuthed } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ServiceTemplate from "@/models/ServiceTemplate";
import { autoSlugFromName, uploadCatalogImage } from "@/lib/upload";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PATCH update service template
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, slug, icon, iconPublicId, status, order } = body;

    const template = await ServiceTemplate.findById(id);
    if (!template) {
      return NextResponse.json({ error: "Service template not found" }, { status: 404 });
    }

    const finalSlug = slug || (name ? autoSlugFromName(name) : template.slug);

    // Check if slug already exists (excluding current template)
    if (finalSlug !== template.slug) {
      const existing = await ServiceTemplate.findOne({ slug: finalSlug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "Service template with this slug already exists" }, { status: 400 });
      }
    }

    template.name = name?.trim() || template.name;
    template.slug = finalSlug.trim();
    template.icon = icon?.trim() || template.icon;
    template.iconPublicId = iconPublicId?.trim() || template.iconPublicId;
    template.status = status || template.status;
    template.order = order !== undefined ? Number(order) : template.order;

    await template.save();

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[API] could not update service template:", error);
    return NextResponse.json({ error: "Could not update service template" }, { status: 500 });
  }
}

// DELETE service template
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const template = await ServiceTemplate.findById(id);
    if (!template) {
      return NextResponse.json({ error: "Service template not found" }, { status: 404 });
    }

    await template.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] could not delete service template:", error);
    return NextResponse.json({ error: "Could not delete service template" }, { status: 500 });
  }
}