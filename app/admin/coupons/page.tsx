import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import CouponsManager from "./CouponsManager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <CouponsManager />;
}
