import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import SellQuestion from "@/models/SellQuestion";
import { clean, slugify } from "@/lib/utils";
import { serializeSellQuestion } from "@/lib/sell-catalog";

export const dynamic = "force-dynamic";

async function uniqueQuestionSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await SellQuestion.findOne(query).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

type OptionInput = { label?: unknown; adjustmentType?: unknown; direction?: unknown; value?: unknown };

function normalizeOptions(
  raw: unknown
): { label: string; adjustmentType: "flat" | "percent"; direction: "reduce" | "increase"; value: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((o: OptionInput) => ({
      label: clean(o?.label),
      adjustmentType: (o?.adjustmentType === "percent" ? "percent" : "flat") as "flat" | "percent",
      direction: (o?.direction === "increase" ? "increase" : "reduce") as "reduce" | "increase",
      value: Number(o?.value),
    }))
    .filter((o) => o.label && Number.isFinite(o.value));
}

/** GET /api/admin/sell-questions — list sell condition questions (admin). */
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const docs = await SellQuestion.find({}).sort({ order: 1, text: 1 }).lean().exec();
    return NextResponse.json({ ok: true, questions: docs.map((doc) => serializeSellQuestion(doc)) });
  } catch (err) {
    console.error("[api GET /api/admin/sell-questions]", err);
    return NextResponse.json({ ok: false, error: "Could not load sell questions." }, { status: 500 });
  }
}

/** POST /api/admin/sell-questions — create a sell condition question (admin). */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const text = clean(body.text);
    const options = normalizeOptions(body.options);
    const status = body.status === "inactive" ? "inactive" : "active";
    const order = Number(body.order);

    if (!text || options.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Question text and at least two valid options are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const baseSlug = slugify(body.slug || text) || `question-${Date.now()}`;
    const slug = await uniqueQuestionSlug(baseSlug);
    const question = await SellQuestion.create({
      text,
      slug,
      options,
      status,
      order: Number.isFinite(order) ? order : 0,
    });
    return NextResponse.json(
      { ok: true, question: serializeSellQuestion(question.toObject()) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api POST /api/admin/sell-questions]", err);
    return NextResponse.json({ ok: false, error: "Could not create sell question." }, { status: 500 });
  }
}
