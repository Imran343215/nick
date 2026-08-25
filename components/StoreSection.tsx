import Link from "next/link";
import StoreGrid from "@/components/StoreGrid";
import type { ProductShape } from "@/lib/products";
import type { SectionHeader } from "@/lib/theme";

const DEFAULT_HEADER: SectionHeader = {
  eyebrow: "iTECHNICK store",
  title: "Phones worth taking home",
  lead: "Quality new and second-hand phones, checked by our repair team and ready for their next chapter.",
};

export default function StoreSection({
  products,
  header,
}: {
  products: ProductShape[];
  header?: SectionHeader;
}) {
  const h = { ...DEFAULT_HEADER, ...(header ?? {}) };
  return (
    <section className="section section--tint" id="store">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">{h.eyebrow}</div>
          <h2 className="section__title">{h.title}</h2>
          <p className="section__lead">{h.lead}</p>
        </div>
        {products.length ? <StoreGrid products={products.slice(0, 3)} /> : <div className="empty-note">Store products are coming soon. Check back shortly.</div>}
        {products.length > 3 && <div className="store-section__action"><Link href="/store" className="btn btn--ghost">Browse the full store</Link></div>}
      </div>
    </section>
  );
}
