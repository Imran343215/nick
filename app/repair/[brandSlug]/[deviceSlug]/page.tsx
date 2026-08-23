import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RepairDeviceBooking from "@/components/repair/RepairDeviceBooking";
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
        <section className="section repair-page repair-page--booking">
          <div className="container repair-container">
            <RepairDeviceBooking brand={brand} device={device} services={services} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
