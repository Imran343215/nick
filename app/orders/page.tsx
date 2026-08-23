import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderLookup from "@/components/OrderLookup";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main>
        <OrderLookup />
      </main>
      <Footer />
    </>
  );
}
