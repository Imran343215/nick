import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy URL — brands now live on the tabbed Repair services page. */
export default async function AdminBrandsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  redirect("/admin/repair-services?tab=brands");
}
