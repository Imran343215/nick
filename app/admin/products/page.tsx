import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProductManager from "./ProductManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <ProductManager />;
}