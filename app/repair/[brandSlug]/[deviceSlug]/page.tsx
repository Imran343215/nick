import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RepairServiceList from "@/components/RepairServiceList";
import {
  fetchActiveBrandBySlug,
  fetchActiveDeviceBySlug,
  fetchActiveServicesForDevice,
} from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function RepairDevicePage({
  params,
}: {
  params: Promise<{ brandSlug: string; deviceSlug: string }>;
}) {
  const { brandSlug, deviceSlug } = await params;
  const brand = await fetchActiveBrandBySlug(brandSlug);
  if (!brand) notFound();

  const device = await fetchActiveDeviceBySlug(brand._id, deviceSlug);
  if (!device) notFound();

  const services = await fetchActiveServicesForDevice(device._id);

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page">
          <div className="container">
            <div className="section__header">
              <div className="section__eyebrow">
                <Link href="/repair" className="repair-breadcrumb">
                  All brands
                </Link>{" "}
                /{" "}
                <Link href={`/repair/${brand.slug}`} className="repair-breadcrumb">
                  {brand.name}
                </Link>{" "}
                / {device.name}
              </div>
              <h1 className="section__title">{device.name} repair services</h1>
              <p className="section__lead">
                Transparent pricing for common repairs on your {brand.name} {device.name}.
              </p>
            </div>
            {services.length > 0 ? (
              <RepairServiceList services={services} />
            ) : (
              <div className="empty-note">
                No repair services are listed for this device yet.
              </div>
            )}
            <div className="repair-page__cta">
              <Link href="/#quote" className="btn btn--primary">
                Get a quote
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
