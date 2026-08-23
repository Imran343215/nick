import mongoose, { Schema, model, models } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Category =
  (models.Category as mongoose.Model<ICategory> | undefined) ||
  model<ICategory>("Category", CategorySchema);

export default Category;