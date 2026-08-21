import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RepairQuery from "@/models/RepairQuery";
import { generateTrackingId, clean, validateEmail } from "@/lib/utils";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function toJSON(q: Record<string, any>) {
  return {
    id: String(q._id),
    name: q.name,
    email: q.email,
    phone: q.phone,
    deviceBrand: q.deviceBrand,
    deviceModel: q.deviceModel ?? "",
    issue: q.issue,
    message: q.message ?? "",
    preferredDate: q.preferredDate
      ? new Date(q.preferredDate).toISOString()
      : null,
    status: q.status,
    trackingId: q.trackingId,
    createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : null,
  };
}

/**
 * POST /api/queries — visitors submit a repair query / quote request.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = clean(body.name);
    const email = clean(body.email).toLowerCase();
    const phone = clean(body.phone);
    const deviceBrand = clean(body.deviceBrand);
    const deviceModel = clean(body.deviceModel);
    const issue = clean(body.issue);
    const message = clean(body.message);

    const rawDate = clean(body.preferredDate);
    const preferredDate =
      rawDate && !Number.isNaN(Date.parse(rawDate))
        ? new Date(rawDate)
        : undefined;

    if (!name || !email || !phone || !deviceBrand || !issue) {
      return NextResponse.json(
        {
          ok: false,
          error: "Name, email, phone, device brand and issue are required.",
        },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const query = await RepairQuery.create({
      name,
      email,
      phone,
      deviceBrand,
      deviceModel,
      issue,
      message,
      preferredDate,
      trackingId: generateTrackingId(),
    });

    return NextResponse.json(
      { ok: true, query: toJSON(query) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/queries]", err);
    return NextResponse.json(
      { ok: false, error: "Could not submit your query. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/queries
 * - ?email=..&phone=..  → users look up the queries they submitted
 * - ?trackingId=..      → look up a single query by its tracking ID
 * - no params           → admin list of the latest 200 queries
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const phone = searchParams.get("phone")?.trim();
    const trackingId = searchParams.get("trackingId")?.trim();

    await connectDB();

    if (trackingId) {
      const found = await RepairQuery.findOne({ trackingId }).lean().exec();
      if (!found) {
        return NextResponse.json(
          { ok: false, error: "No query found with that tracking ID." },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, query: toJSON(found) });
    }

    const filter: Record<string, string> = {};
    if (email) filter.email = email;
    if (phone) filter.phone = phone;

    if (Object.keys(filter).length === 0) {
      // Admin list — require the signed admin cookie.
      if (!(await isAdminAuthed())) {
        return NextResponse.json(
          { ok: false, error: "Admin authentication required." },
          { status: 401 }
        );
      }
      const all = await RepairQuery.find()
        .sort({ createdAt: -1 })
        .limit(200)
        .lean()
        .exec();
      return NextResponse.json({
        ok: true,
        count: all.length,
        queries: all.map(toJSON),
      });
    }

    const matched = await RepairQuery.find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return NextResponse.json({
      ok: true,
      count: matched.length,
      queries: matched.map(toJSON),
    });
  } catch (err) {
    console.error("[api GET /api/queries]", err);
    return NextResponse.json(
      { ok: false, error: "Could not load queries." },
      { status: 500 }
    );
  }
}