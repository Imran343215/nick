import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeviceServicesManager from "./DeviceServicesManager";

export const dynamic = "force-dynamic";

export default async function AdminDeviceServicesPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <DeviceServicesManager />;
}
