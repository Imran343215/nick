import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import RepairCategoriesManager from "./RepairCategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminRepairCategoriesPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <RepairCategoriesManager />;
}