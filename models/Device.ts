import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IDevice {
  brand: Types.ObjectId;
  name: string;
  slug: string;
  image: string;
  imagePublicId?: string;
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    image: { type: String, required: true, trim: true },
    imagePublicId: { type: String, trim: true },
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

DeviceSchema.index({ brand: 1, slug: 1 }, { unique: true });

const Device =
  (models.Device as mongoose.Model<IDevice> | undefined) ||
  model<IDevice>("Device", DeviceSchema);

export default Device;
