import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import BannerManager from "./BannerManager";

export const dynamic = "force-dynamic";

export default async function AdminBannerPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <BannerManager />;
}
