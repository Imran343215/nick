import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import ThemeManager from "./ThemeManager";

export const dynamic = "force-dynamic";

export default async function AdminThemePage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <ThemeManager />;
}
