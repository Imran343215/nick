import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy URL — categories now live on the tabbed Repair services page. */
export default async function AdminRepairCategoriesPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  redirect("/admin/repair-services?tab=categories");
}