import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import RepairBookingsManager from "./RepairBookingsManager";

export const dynamic = "force-dynamic";

export default async function AdminRepairBookingsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <RepairBookingsManager />;
}
