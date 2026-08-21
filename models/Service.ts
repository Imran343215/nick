import mongoose, { Schema, models, model } from "mongoose";

export interface IService {
  name: string;
  slug?: string;
  description: string;
  category: string;
  priceFrom: number;
  turnaroundDays: number;
  icon: string;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    category: { type: String, default: "General", trim: true },
    priceFrom: { type: Number, required: true, min: 0 },
    turnaroundDays: { type: Number, default: 1, min: 0 },
    icon: { type: String, default: "🔧", trim: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Service =
  (models.Service as mongoose.Model<IService> | undefined) ||
  model<IService>("Service", ServiceSchema);

export default Service;