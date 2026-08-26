import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import RepairServicesAdmin from "./RepairServicesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminRepairServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await isAdminAuthed())) redirect("/admin");
  const { tab } = await searchParams;
  return <RepairServicesAdmin initialTab={tab} />;
}
