import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import RepairServicesManager from "./RepairServicesManager";

export const dynamic = "force-dynamic";

export default async function AdminRepairServicesPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <RepairServicesManager />;
}
