import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IServiceTemplate {
  name: string;
  slug: string;
  icon: string;
  iconPublicId?: string;
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ServiceTemplateSchema = new Schema<IServiceTemplate>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
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

const ServiceTemplate =
  (models.ServiceTemplate as mongoose.Model<IServiceTemplate> | undefined) ||
  model<IServiceTemplate>("ServiceTemplate", ServiceTemplateSchema);

export default ServiceTemplate;