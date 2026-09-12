import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import SellVariantsManager from "./SellVariantsManager";

export const dynamic = "force-dynamic";

export default async function AdminSellVariantsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <SellVariantsManager />;
}
