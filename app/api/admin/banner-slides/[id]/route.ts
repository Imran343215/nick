import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import BannerSlide from "@/models/BannerSlide";
import { clean } from "@/lib/utils";
import { serializeBannerSlide } from "@/lib/banner";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/banner-slides/:id — update a slide (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};
    if (typeof body.imageUrl === "string") {
      const imageUrl = clean(body.imageUrl);
      if (!imageUrl) {
        return NextResponse.json(
          { ok: false, error: "An image is required — slides without an image are never shown." },
          { status: 400 }
        );
      }
      update.imageUrl = imageUrl;
    }
    if (typeof body.imagePublicId === "string") update.imagePublicId = clean(body.imagePublicId) || undefined;
    if (typeof body.title === "string") update.title = clean(body.title) || undefined;
    if (typeof body.subtitle === "string") update.subtitle = clean(body.subtitle) || undefined;
    if (typeof body.buttonLabel === "string") update.buttonLabel = clean(body.buttonLabel) || undefined;
    if (typeof body.link === "string") update.link = clean(body.link) || undefined;
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (typeof body.order === "number" && Number.isFinite(body.order)) update.order = body.order;

    const slide = await BannerSlide.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!slide) {
      return NextResponse.json({ ok: false, error: "Banner slide not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, slide: serializeBannerSlide(slide) });
  } catch (err) {
    console.error("[api PATCH /api/admin/banner-slides/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update banner slide." }, { status: 500 });
  }
}

/** DELETE /api/admin/banner-slides/:id — remove a slide (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await BannerSlide.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Banner slide not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/banner-slides/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete banner slide." }, { status: 500 });
  }
}
