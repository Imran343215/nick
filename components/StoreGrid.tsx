import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { ProductShape } from "@/lib/products";

export default function StoreGrid({ products }: { products: ProductShape[] }) {
  return (
    <div className="store-grid">
      {products.map((product) => (
        <article className="product-card" key={product._id}>
          <Link href={`/store/${product.slug}`} className="product-card__image-wrap">
            <img src={product.imageUrl} alt={product.name} className="product-card__image" />
            <span className="product-card__condition">{product.condition === "new" ? "New" : "Second hand"}</span>
          </Link>
          <div className="product-card__body">
            {product.category && (
              <span className="product-card__category">{product.category}</span>
            )}
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div className="product-card__footer">
              <strong>{formatPrice(product.price)}</strong>
              <Link href={`/store/${product.slug}`} className="btn btn--primary product-card__button">
                {product.stock > 0 ? "View item" : "Sold out"}
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}