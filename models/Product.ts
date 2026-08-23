import mongoose, { Schema, model, models } from "mongoose";

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  category?: string;
  condition: "new" | "second-hand";
  price: number;
  currency: "gbp";
  imageUrl: string;
  imagePublicId?: string;
  stock: number;
  active: boolean;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true, index: true },
    condition: { type: String, enum: ["new", "second-hand"], required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["gbp"], default: "gbp" },
    imageUrl: { type: String, required: true, trim: true },
    imagePublicId: { type: String, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product =
  (models.Product as mongoose.Model<IProduct> | undefined) ||
  model<IProduct>("Product", ProductSchema);

export default Product;