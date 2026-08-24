import mongoose, { Schema, model, models } from "mongoose";

export interface IRepairCategory {
  name: string;
  slug: string;
  icon: string;
  iconPublicId?: string;
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairCategorySchema = new Schema<IRepairCategory>(
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
    icon: { type: String, required: true, trim: true },
    iconPublicId: { type: String, trim: true },
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

const RepairCategory =
  (models.RepairCategory as mongoose.Model<IRepairCategory> | undefined) ||
  model<IRepairCategory>("RepairCategory", RepairCategorySchema);

export default RepairCategory;