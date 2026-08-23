import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export type ProductShape = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category?: string;
  condition: "new" | "second-hand";
  price: number;
  currency: "gbp";
  imageUrl: string;
  stock: number;
  active: boolean;
  featured: boolean;
};

export function serializeProduct(product: Record<string, any>): ProductShape {
  return {
    _id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description,
    condition: product.condition,
    price: product.price,
    currency: product.currency ?? "gbp",
    imageUrl: product.imageUrl,
    category: product.category ?? "",
    stock: product.stock,
    active: product.active,
    featured: product.featured,
  };
}

export async function fetchProducts(): Promise<ProductShape[]> {
  try {
    await connectDB();
    const products = await Product.find({ active: true })
      .sort({ featured: -1, createdAt: -1 })
      .lean()
      .exec();
    return products.map((product) => serializeProduct(product));
  } catch (err) {
    console.error("[products] could not load products from DB:", err);
    return [];
  }
}