import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import BrandsManager from "./BrandsManager";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <BrandsManager />;
}
