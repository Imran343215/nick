import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import SellQuestionsManager from "./SellQuestionsManager";

export const dynamic = "force-dynamic";

export default async function AdminSellQuestionsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <SellQuestionsManager />;
}
