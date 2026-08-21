import { connectDB } from "@/lib/db";
import Service from "@/models/Service";

export type ServiceShape = {
  _id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  priceFrom: number;
  turnaroundDays: number;
  icon: string;
  featured: boolean;
};

/**
 * Loads the repair services from MongoDB.
 * Returns an empty list instead of throwing, so the page still renders
 * even when the database is temporarily unavailable.
 */
export async function fetchServices(): Promise<ServiceShape[]> {
  try {
    await connectDB();
    const docs = await Service.find()
      .sort({ featured: -1, priceFrom: 1 })
      .lean()
      .exec();

    return docs.map((d) => ({
      _id: String(d._id),
      name: d.name,
      slug: d.slug,
      description: d.description,
      category: d.category,
      priceFrom: d.priceFrom,
      turnaroundDays: d.turnaroundDays,
      icon: d.icon,
      featured: d.featured,
    }));
  } catch (err) {
    console.error("[services] could not load services from DB:", err);
    return [];
  }
}