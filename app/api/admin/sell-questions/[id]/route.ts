import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import SellQuestion from "@/models/SellQuestion";
import { clean, slugify } from "@/lib/utils";
import { serializeSellQuestion } from "@/lib/sell-catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };
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

async function uniqueQuestionSlug(base: string, excludeId: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await SellQuestion.findOne({ slug, _id: { $ne: excludeId } }).lean().exec();
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

/** PATCH /api/admin/sell-questions/:id — update a sell question (admin). */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const existing = await SellQuestion.findById(id).lean().exec();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Sell question not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.text === "string" && clean(body.text)) update.text = clean(body.text);
    if (Array.isArray(body.options)) {
      const options = normalizeOptions(body.options);
      if (options.length < 2) {
        return NextResponse.json(
          { ok: false, error: "At least two valid options are required." },
          { status: 400 }
        );
      }
      update.options = options;
    }
    if (body.status === "active" || body.status === "inactive") update.status = body.status;
    if (typeof body.order === "number" && Number.isFinite(body.order)) update.order = body.order;

    if (typeof body.slug === "string" && clean(body.slug)) {
      update.slug = await uniqueQuestionSlug(slugify(body.slug), id);
    } else if (update.text && typeof update.text === "string") {
      update.slug = await uniqueQuestionSlug(slugify(update.text as string), id);
    }

    const question = await SellQuestion.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!question) {
      return NextResponse.json({ ok: false, error: "Sell question not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, question: serializeSellQuestion(question) });
  } catch (err) {
    console.error("[api PATCH /api/admin/sell-questions/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not update sell question." }, { status: 500 });
  }
}

/** DELETE /api/admin/sell-questions/:id — remove a sell question (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await SellQuestion.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Sell question not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/sell-questions/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete sell question." }, { status: 500 });
  }
}
