import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function SellSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandSlug: string; deviceSlug: string }>;
  searchParams: Promise<{ tracking?: string }>;
}) {
  const { brandSlug, deviceSlug } = await params;
  const { tracking } = await searchParams;

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page">
          <div className="container">
            <div className="form-card repair-success-card">
              <div className="section__eyebrow">Request submitted</div>
              <h1 className="section__title">We&apos;ll pick up your device soon</h1>
              <p className="section__lead">
                Our agent will inspect the device at pickup and confirm your final payout. We&apos;ll
                pay out via the method you selected once it&apos;s verified.
              </p>
              {tracking && (
                <p className="repair-success-tracking">
                  Tracking ID: <strong className="tracking-id">{tracking}</strong>
                </p>
              )}
              <div className="form__actions">
                <Link href={`/sell/${brandSlug}/${deviceSlug}`} className="btn btn--ghost">
                  Sell another device
                </Link>
                <Link href="/#track" className="btn btn--repair">
                  Track your request
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
