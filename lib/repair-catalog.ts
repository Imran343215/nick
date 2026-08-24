import { connectDB } from "@/lib/db";
import Brand from "@/models/Brand";
import RepairCategory from "@/models/RepairCategory";
import Device from "@/models/Device";
import RepairService from "@/models/RepairService";
import ServiceTemplate from "@/models/ServiceTemplate";

export type CategoryShape = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  status: "active" | "inactive";
  order: number;
};

export type BrandShape = {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  category?: string;
  categoryName?: string;
  categorySlug?: string;
  status: "active" | "inactive";
  order: number;
};

export type DeviceShape = {
  _id: string;
  brand: string;
  brandName?: string;
  brandSlug?: string;
  name: string;
  slug: string;
  image: string;
  status: "active" | "inactive";
  order: number;
};

export type RepairServiceShape = {
  _id: string;
  device: string;
  serviceTemplate: string;
  deviceName?: string;
  deviceSlug?: string;
  brandName?: string;
  brandSlug?: string;
  name: string;
  slug: string;
  icon: string;
  price: number;
  discountPrice?: number;
  estimatedTime?: string;
  status: "active" | "inactive";
  order: number;
};

export type ServiceTemplateShape = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  status: "active" | "inactive";
  order: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc = Record<string, any>;

export function serializeCategory(doc: Doc): CategoryShape {
  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    icon: doc.icon as string,
    status: doc.status as CategoryShape["status"],
    order: Number(doc.order ?? 0),
  };
}

export function serializeBrand(doc: Doc, category?: Doc | null): BrandShape {
  const catDoc =
    category ??
    ((doc.category as Record<string, unknown> | null | undefined) ?? null);
  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    logo: doc.logo as string,
    category: catDoc ? String(catDoc._id ?? doc.category) : undefined,
    categoryName: catDoc ? (catDoc.name as string | undefined) : undefined,
    categorySlug: catDoc ? (catDoc.slug as string | undefined) : undefined,
    status: doc.status as BrandShape["status"],
    order: Number(doc.order ?? 0),
  };
}

export function serializeDevice(
  doc: Doc,
  brand?: Doc | null
): DeviceShape {
  const brandDoc = brand ?? (doc.brand as Record<string, unknown> | null);
  return {
    _id: String(doc._id),
    brand: brandDoc ? String(brandDoc._id ?? doc.brand) : String(doc.brand),
    brandName: brandDoc ? (brandDoc.name as string) : undefined,
    brandSlug: brandDoc ? (brandDoc.slug as string) : undefined,
    name: doc.name as string,
    slug: doc.slug as string,
    image: doc.image as string,
    status: doc.status as DeviceShape["status"],
    order: Number(doc.order ?? 0),
  };
}

export function serializeRepairService(
  doc: Doc,
  device?: Doc | null,
  serviceTemplate?: Doc | null
): RepairServiceShape {
  const deviceDoc = device ?? (doc.device as Record<string, unknown> | null);
  const brandDoc = deviceDoc?.brand as Record<string, unknown> | undefined;
  const templateDoc = serviceTemplate ?? (doc.serviceTemplate as Record<string, unknown> | null);
  return {
    _id: String(doc._id),
    device: deviceDoc ? String(deviceDoc._id ?? doc.device) : String(doc.device),
    serviceTemplate: templateDoc ? String(templateDoc._id ?? doc.serviceTemplate) : String(doc.serviceTemplate),
    deviceName: deviceDoc ? (deviceDoc.name as string) : undefined,
    deviceSlug: deviceDoc ? (deviceDoc.slug as string) : undefined,
    brandName: brandDoc ? (brandDoc.name as string) : undefined,
    brandSlug: brandDoc ? (brandDoc.slug as string) : undefined,
    name: doc.name as string,
    slug: doc.slug as string,
    icon: templateDoc ? (templateDoc.icon as string) : (doc.icon as string),
    price: Number(doc.price),
    discountPrice:
      doc.discountPrice != null ? Number(doc.discountPrice) : undefined,
    estimatedTime: doc.estimatedTime as string | undefined,
    status: doc.status as RepairServiceShape["status"],
    order: Number(doc.order ?? 0),
  };
}

export function serializeServiceTemplate(doc: Doc): ServiceTemplateShape {
  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    icon: doc.icon as string,
    status: doc.status as ServiceTemplateShape["status"],
    order: Number(doc.order ?? 0),
  };
}

export async function fetchActiveCategories(): Promise<CategoryShape[]> {
  try {
    await connectDB();
    const docs = await RepairCategory.find({ status: "active" })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeCategory(doc));
  } catch (err) {
    console.error("[repair-catalog] could not load categories:", err);
    return [];
  }
}

export async function fetchActiveCategoryBySlug(
  slug: string
): Promise<CategoryShape | null> {
  try {
    await connectDB();
    const doc = await RepairCategory.findOne({ slug, status: "active" })
      .lean()
      .exec();
    return doc ? serializeCategory(doc) : null;
  } catch (err) {
    console.error("[repair-catalog] could not load category:", err);
    return null;
  }
}

export async function fetchActiveBrandsForCategory(
  categoryId: string
): Promise<BrandShape[]> {
  try {
    await connectDB();
    const docs = await Brand.find({ category: categoryId, status: "active" })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeBrand(doc));
  } catch (err) {
    console.error("[repair-catalog] could not load brands for category:", err);
    return [];
  }
}

export async function fetchActiveBrands(): Promise<BrandShape[]> {
  try {
    await connectDB();
    const docs = await Brand.find({ status: "active" })
      .populate("category")
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeBrand(doc));
  } catch (err) {
    console.error("[repair-catalog] could not load brands:", err);
    return [];
  }
}

export async function fetchActiveBrandBySlug(slug: string): Promise<BrandShape | null> {
  try {
    await connectDB();
    const doc = await Brand.findOne({ slug, status: "active" })
      .populate("category")
      .lean()
      .exec();
    return doc ? serializeBrand(doc) : null;
  } catch (err) {
    console.error("[repair-catalog] could not load brand:", err);
    return null;
  }
}

export async function fetchActiveDevicesForBrand(brandId: string): Promise<DeviceShape[]> {
  try {
    await connectDB();
    const docs = await Device.find({ brand: brandId, status: "active" })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeDevice(doc));
  } catch (err) {
    console.error("[repair-catalog] could not load devices:", err);
    return [];
  }
}

export async function fetchActiveDeviceBySlug(
  brandId: string,
  slug: string
): Promise<DeviceShape | null> {
  try {
    await connectDB();
    const doc = await Device.findOne({ brand: brandId, slug, status: "active" })
      .lean()
      .exec();
    return doc ? serializeDevice(doc) : null;
  } catch (err) {
    console.error("[repair-catalog] could not load device:", err);
    return null;
  }
}

export async function fetchActiveServicesForDevice(
  deviceId: string
): Promise<RepairServiceShape[]> {
  try {
    await connectDB();
    const docs = await RepairService.find({ device: deviceId, status: "active" })
      .populate("serviceTemplate")
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeRepairService(doc, undefined, doc.serviceTemplate as Doc | null));
  } catch (err) {
    console.error("[repair-catalog] could not load repair services:", err);
    return [];
  }
}

export async function fetchActiveServiceTemplates(): Promise<ServiceTemplateShape[]> {
  try {
    await connectDB();
    const docs = await ServiceTemplate.find({ status: "active" })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeServiceTemplate(doc));
  } catch (err) {
    console.error("[repair-catalog] could not load service templates:", err);
    return [];
  }
}

export async function fetchServiceTemplateBySlug(slug: string): Promise<ServiceTemplateShape | null> {
  try {
    await connectDB();
    const doc = await ServiceTemplate.findOne({ slug, status: "active" }).lean().exec();
    return doc ? serializeServiceTemplate(doc) : null;
  } catch (err) {
    console.error("[repair-catalog] could not load service template:", err);
    return null;
  }
}
