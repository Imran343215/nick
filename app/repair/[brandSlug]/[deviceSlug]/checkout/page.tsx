import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RepairCheckout from "@/components/repair/RepairCheckout";

export const dynamic = "force-dynamic";

export default async function RepairCheckoutPage({
  params,
}: {
  params: Promise<{ brandSlug: string; deviceSlug: string }>;
}) {
  const { brandSlug, deviceSlug } = await params;

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page repair-page--booking">
          <div className="container repair-container">
            <RepairCheckout brandSlug={brandSlug} deviceSlug={deviceSlug} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
