import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import QuoteForm from "@/components/QuoteForm";
import TrackRepair from "@/components/TrackRepair";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { fetchServices } from "@/lib/services";

// Render fresh services on every request (no static caching).
export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await fetchServices();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services services={services} />
        <HowItWorks />
        <QuoteForm />
        <TrackRepair />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}