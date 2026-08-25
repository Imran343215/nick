import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import TrackRepair from "@/components/TrackRepair";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import StoreSection from "@/components/StoreSection";
import { fetchServices } from "@/lib/services";
import { fetchProducts } from "@/lib/products";
import { fetchTheme, type SectionKey } from "@/lib/theme";
import { Fragment, type ReactNode } from "react";
import PreviewBridge from "@/components/PreviewBridge";

// Render fresh services + theme on every request (no static caching).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [services, products, theme] = await Promise.all([
    fetchServices(),
    fetchProducts(),
    fetchTheme(),
  ]);

  // Sections rendered in admin-defined order, honouring enable/disable.
  const sections: Record<SectionKey, ReactNode> = {
    hero: <Hero content={theme.hero} />,
    services: <Services services={services} header={theme.headers.services} />,
    store: <StoreSection products={products} header={theme.headers.store} />,
    howItWorks: <HowItWorks header={theme.headers.howItWorks} />,
    trackRepair: <TrackRepair header={theme.headers.trackRepair} />,
    testimonials: (
      <Testimonials
        header={theme.headers.testimonials}
        items={theme.testimonials}
      />
    ),
    contact: (
      <Contact header={theme.headers.contact} cards={theme.contactCards} />
    ),
  };

  return (
    <>
      {/* Live-preview receiver for the admin Theme Customizer iframe. */}
      <PreviewBridge />
      <Header
        brand={{
          name: theme.brandName,
          initials: theme.brandInitials,
          logoUrl: theme.logoUrl,
        }}
      />
      <main>
        {theme.sections.order
          .filter((key) => theme.sections.enabled[key])
          .map((key) => (
            <Fragment key={key}>{sections[key]}</Fragment>
          ))}
      </main>
      <Footer brandName={theme.brandName} text={theme.footerText} />
    </>
  );
}
