import mongoose, { Schema, model, models } from "mongoose";

export type SellAdjustmentType = "flat" | "percent";
export type SellAdjustmentDirection = "reduce" | "increase";

export interface ISellQuestionOption {
  label: string;
  /** "flat" = a currency amount; "percent" = a % of the variant's max price. */
  adjustmentType: SellAdjustmentType;
  /** Whether this option reduces (the common case) or increases the price. */
  direction: SellAdjustmentDirection;
  /** Always a positive magnitude — direction decides the sign. */
  value: number;
}

export interface ISellQuestion {
  text: string;
  slug: string;
  options: ISellQuestionOption[];
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const SellQuestionOptionSchema = new Schema<ISellQuestionOption>(
  {
    label: { type: String, required: true, trim: true },
    adjustmentType: { type: String, enum: ["flat", "percent"], required: true, default: "flat" },
    direction: { type: String, enum: ["reduce", "increase"], required: true, default: "reduce" },
    value: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const SellQuestionSchema = new Schema<ISellQuestion>(
  {
    text: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    options: {
      type: [SellQuestionOptionSchema],
      required: true,
      validate: {
        validator: (v: ISellQuestionOption[]) => Array.isArray(v) && v.length >= 2,
        message: "A question needs at least two options.",
      },
    },
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

const SellQuestion =
  (models.SellQuestion as mongoose.Model<ISellQuestion> | undefined) ||
  model<ISellQuestion>("SellQuestion", SellQuestionSchema);

export default SellQuestion;
