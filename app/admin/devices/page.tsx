import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import DevicesManager from "./DevicesManager";

export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <DevicesManager />;
}
