import mongoose, { Schema, model, models } from "mongoose";

export interface IBrand {
  name: string;
  slug: string;
  logo: string;
  logoPublicId?: string;
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    logo: { type: String, required: true, trim: true },
    logoPublicId: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const Brand =
  (models.Brand as mongoose.Model<IBrand> | undefined) ||
  model<IBrand>("Brand", BrandSchema);

export default Brand;
