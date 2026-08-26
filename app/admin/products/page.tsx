import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProductsAdmin from "./ProductsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await isAdminAuthed())) redirect("/admin");
  const { tab } = await searchParams;
  return <ProductsAdmin initialTab={tab} />;
}