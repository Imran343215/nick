import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RepairDeviceGrid from "@/components/RepairDeviceGrid";
import {
  fetchActiveBrandBySlug,
  fetchActiveDevicesForBrand,
} from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function RepairBrandPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;
  const brand = await fetchActiveBrandBySlug(brandSlug);
  if (!brand) notFound();

  const devices = await fetchActiveDevicesForBrand(brand._id);

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
                </Link>
                {brand.categorySlug && brand.categoryName ? (
                  <>
                    {" "}/{" "}
                    <Link href={`/repair/category/${brand.categorySlug}`} className="repair-breadcrumb">
                      {brand.categoryName}
                    </Link>
                  </>
                ) : null}
                {" "}/ {brand.name}
              </div>
              <h1 className="section__title">{brand.name} repairs</h1>
              <p className="section__lead">Choose your device model to see available repairs.</p>
            </div>
            {devices.length > 0 ? (
              <RepairDeviceGrid devices={devices} brandSlug={brand.slug} />
            ) : (
              <div className="empty-note">
                No devices are listed for {brand.name} yet.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
