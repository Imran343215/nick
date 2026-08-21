import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RepairQuery, { type QueryStatus } from "@/models/RepairQuery";

export const dynamic = "force-dynamic";

const VALID_STATUSES: QueryStatus[] = [
  "new",
  "contacted",
  "quoted",
  "completed",
  "closed",
];

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/queries/:id — remove a query (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await RepairQuery.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "Query not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/queries/:id]", err);
    return NextResponse.json(
      { ok: false, error: "Could not delete the query." },
      { status: 500 }
    );
  }
}

/** PATCH /api/queries/:id — update the status of a query (admin). */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status as QueryStatus;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status value." },
        { status: 400 }
      );
    }

    await connectDB();
    const updated = await RepairQuery.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Query not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, query: updated });
  } catch (err) {
    console.error("[api PATCH /api/queries/:id]", err);
    return NextResponse.json(
      { ok: false, error: "Could not update the query." },
      { status: 500 }
    );
  }
}