import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export type CategoryShape = {
  _id: string;
  name: string;
  slug: string;
};

/**
 * Loads the store categories from MongoDB.
 * Returns an empty list instead of throwing so the store page still renders
 * when the database is temporarily unavailable.
 */
export async function fetchCategories(): Promise<CategoryShape[]> {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean().exec();
    return categories.map((c) => ({
      _id: String(c._id),
      name: c.name,
      slug: c.slug,
    }));
  } catch (err) {
    console.error("[categories] could not load categories from DB:", err);
    return [];
  }
}