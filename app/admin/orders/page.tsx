import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrdersManager from "./OrdersManager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <OrdersManager />;
}