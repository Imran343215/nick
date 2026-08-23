import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IRepairService {
  device: Types.ObjectId;
  name: string;
  slug: string;
  icon: string;
  iconPublicId?: string;
  price: number;
  discountPrice?: number;
  estimatedTime?: string;
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairServiceSchema = new Schema<IRepairService>(
  {
    device: { type: Schema.Types.ObjectId, ref: "Device", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    icon: { type: String, required: true, trim: true },
    iconPublicId: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    estimatedTime: { type: String, trim: true },
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

RepairServiceSchema.index({ device: 1, slug: 1 }, { unique: true });

const RepairService =
  (models.RepairService as mongoose.Model<IRepairService> | undefined) ||
  model<IRepairService>("RepairService", RepairServiceSchema);

export default RepairService;
