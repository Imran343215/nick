import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import BannerSettings from "@/models/BannerSettings";
import { fetchBannerSettings } from "@/lib/banner";

export const dynamic = "force-dynamic";

/** GET /api/admin/banner-settings — current carousel settings (admin). */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const settings = await fetchBannerSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("[api GET /api/admin/banner-settings]", err);
    return NextResponse.json({ ok: false, error: "Could not load carousel settings." }, { status: 500 });
  }
}

/** PUT /api/admin/banner-settings — save carousel-wide settings (admin). */
export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const enabled = body.enabled !== false;
    const autoplaySeconds = Math.min(15, Math.max(2, Math.round(Number(body.autoplaySeconds)) || 5));

    await connectDB();
    const settings = await BannerSettings.findByIdAndUpdate(
      "banner",
      { _id: "banner", enabled, autoplaySeconds },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    return NextResponse.json({
      ok: true,
      settings: { enabled: settings.enabled !== false, autoplaySeconds: settings.autoplaySeconds },
    });
  } catch (err) {
    console.error("[api PUT /api/admin/banner-settings]", err);
    return NextResponse.json({ ok: false, error: "Could not save carousel settings." }, { status: 500 });
  }
}
