import Link from "next/link";
import type { BrandShape } from "@/lib/repair-catalog";

export default function SellBrandGrid({ brands }: { brands: BrandShape[] }) {
  return (
    <div className="repair-grid">
      {brands.map((brand) => (
        <Link key={brand._id} href={`/sell/${brand.slug}`} className="repair-card repair-card--brand">
          <div className="repair-card__media">
            <img src={brand.logo} alt={brand.name} />
          </div>
          <h3>{brand.name}</h3>
        </Link>
      ))}
    </div>
  );
}
