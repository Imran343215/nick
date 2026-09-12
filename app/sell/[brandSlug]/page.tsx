import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SellDeviceGrid from "@/components/SellDeviceGrid";
import { fetchActiveBrandBySlug, fetchActiveDevicesForBrand } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function SellBrandPage({
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
                <Link href="/sell" className="repair-breadcrumb">
                  Sell your phone
                </Link>
                {" "}/ {brand.name}
              </div>
              <h1 className="section__title">Sell your {brand.name}</h1>
              <p className="section__lead">Choose your device model to get an instant quote.</p>
            </div>
            {devices.length > 0 ? (
              <SellDeviceGrid devices={devices} brandSlug={brand.slug} />
            ) : (
              <div className="empty-note">No devices are listed for {brand.name} yet.</div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
