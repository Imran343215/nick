import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RepairBrandGrid from "@/components/RepairBrandGrid";
import {
  fetchActiveBrandsForCategory,
  fetchActiveCategoryBySlug,
} from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function RepairCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const category = await fetchActiveCategoryBySlug(categorySlug);
  if (!category) notFound();

  const brands = await fetchActiveBrandsForCategory(category._id);

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page">
          <div className="container">
            <div className="section__header">
              <div className="section__eyebrow">
                <Link href="/repair" className="repair-breadcrumb">
                  All repairs
                </Link>{" "}
                / {category.name}
              </div>
              <h1 className="section__title">{category.name}</h1>
              <p className="section__lead">Choose your brand to browse models and repair options.</p>
            </div>
            {brands.length > 0 ? (
              <RepairBrandGrid brands={brands} />
            ) : (
              <div className="empty-note">
                No brands are listed under {category.name} yet. Please check back soon.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}