import mongoose, { Schema, model, models, Types } from "mongoose";

export interface ISellVariant {
  device: Types.ObjectId;
  label: string;
  slug: string;
  basePrice: number;
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const SellVariantSchema = new Schema<ISellVariant>(
  {
    device: { type: Schema.Types.ObjectId, ref: "Device", required: true, index: true },
    label: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    basePrice: { type: Number, required: true, min: 0 },
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

SellVariantSchema.index({ device: 1, slug: 1 }, { unique: true });

const SellVariant =
  (models.SellVariant as mongoose.Model<ISellVariant> | undefined) ||
  model<ISellVariant>("SellVariant", SellVariantSchema);

export default SellVariant;
