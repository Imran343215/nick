import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SellCheckout from "@/components/sell/SellCheckout";

export const dynamic = "force-dynamic";

export default async function SellCheckoutPage({
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
            <SellCheckout brandSlug={brandSlug} deviceSlug={deviceSlug} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
