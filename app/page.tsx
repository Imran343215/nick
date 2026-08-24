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

// Render fresh services on every request (no static caching).
export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await fetchServices();
  const products = await fetchProducts();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services services={services} />
        <StoreSection products={products} />
        <HowItWorks />
        <TrackRepair />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}