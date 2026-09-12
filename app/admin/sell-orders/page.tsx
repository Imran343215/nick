import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import SellOrdersManager from "./SellOrdersManager";

export const dynamic = "force-dynamic";

export default async function AdminSellOrdersPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <SellOrdersManager />;
}
