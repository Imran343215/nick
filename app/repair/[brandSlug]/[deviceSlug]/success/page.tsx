import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function RepairSuccessPage({
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
              <div className="section__eyebrow">Booking confirmed</div>
              <h1 className="section__title">Your repair is booked</h1>
              <p className="section__lead">
                We have received your request. Our technician will contact you to confirm
                the visit.
              </p>
              {tracking && (
                <p className="repair-success-tracking">
                  Tracking ID: <strong className="tracking-id">{tracking}</strong>
                </p>
              )}
              <div className="form__actions">
                <Link href={`/repair/${brandSlug}/${deviceSlug}`} className="btn btn--ghost">
                  Book another repair
                </Link>
                <Link href="/#track" className="btn btn--repair">
                  Track repair
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
