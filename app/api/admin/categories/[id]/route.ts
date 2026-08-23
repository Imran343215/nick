import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import Category from "@/models/Category";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/admin/categories/:id — remove a category (admin). */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthed()))
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await Category.findByIdAndDelete(id).lean().exec();
    if (!deleted)
      return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api DELETE /api/admin/categories/:id]", err);
    return NextResponse.json({ ok: false, error: "Could not delete the category." }, { status: 500 });
  }
}