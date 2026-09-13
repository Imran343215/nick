import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import BannerSlide from "@/models/BannerSlide";
import { clean } from "@/lib/utils";
import { serializeBannerSlide } from "@/lib/banner";

export const dynamic = "force-dynamic";

/** GET /api/admin/banner-slides — list every slide, including inactive ones (admin). */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const docs = await BannerSlide.find({}).sort({ order: 1, createdAt: 1 }).lean().exec();
    return NextResponse.json({ ok: true, slides: docs.map((doc) => serializeBannerSlide(doc)) });
  } catch (err) {
    console.error("[api GET /api/admin/banner-slides]", err);
    return NextResponse.json({ ok: false, error: "Could not load banner slides." }, { status: 500 });
  }
}

/** POST /api/admin/banner-slides — create a slide (admin). Image is required. */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const imageUrl = clean(body.imageUrl);
    if (!imageUrl) {
      return NextResponse.json(
        { ok: false, error: "An image is required — slides without an image are never shown." },
        { status: 400 }
      );
    }

    await connectDB();
    const slide = await BannerSlide.create({
      imageUrl,
      imagePublicId: clean(body.imagePublicId) || undefined,
      title: clean(body.title) || undefined,
      subtitle: clean(body.subtitle) || undefined,
      buttonLabel: clean(body.buttonLabel) || undefined,
      link: clean(body.link) || undefined,
      status: body.status === "inactive" ? "inactive" : "active",
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    });
    return NextResponse.json({ ok: true, slide: serializeBannerSlide(slide.toObject()) }, { status: 201 });
  } catch (err) {
    console.error("[api POST /api/admin/banner-slides]", err);
    return NextResponse.json({ ok: false, error: "Could not create banner slide." }, { status: 500 });
  }
}
