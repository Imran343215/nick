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
  
  // Fetch brand first to get the brand ID
  const brand = await fetchActiveBrandBySlug(brandSlug);
  if (!brand) notFound();

  // Fetch device
  const device = await fetchActiveDeviceBySlug(brand._id, deviceSlug);
  if (!device) notFound();

  // Fetch services for the specific device
  const services = await fetchActiveServicesForDevice(device._id);

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page repair-page--booking">
          <div className="container repair-container">
            <RepairDeviceBooking brand={brand} device={device} services={services || []} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
