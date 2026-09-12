import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SellQuestionnaire from "@/components/sell/SellQuestionnaire";
import { fetchActiveBrandBySlug, fetchActiveDeviceBySlug } from "@/lib/repair-catalog";
import { fetchActiveQuestions, fetchActiveVariantsForDevice } from "@/lib/sell-catalog";

export const dynamic = "force-dynamic";

export default async function SellDevicePage({
  params,
}: {
  params: Promise<{ brandSlug: string; deviceSlug: string }>;
}) {
  const { brandSlug, deviceSlug } = await params;

  const brand = await fetchActiveBrandBySlug(brandSlug);
  if (!brand) notFound();

  const device = await fetchActiveDeviceBySlug(brand._id, deviceSlug);
  if (!device) notFound();

  const [variants, questions] = await Promise.all([
    fetchActiveVariantsForDevice(device._id),
    fetchActiveQuestions(),
  ]);

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page repair-page--booking">
          <div className="container repair-container">
            <SellQuestionnaire brand={brand} device={device} variants={variants} questions={questions} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
