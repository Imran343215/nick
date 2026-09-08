import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { jsonWithCors, handleOptions } from '@/lib/cors';
import Brand from '@/models/Brand';
import RepairCategory from '@/models/RepairCategory';
import Device from '@/models/Device';
import RepairService from '@/models/RepairService';

export const dynamic = 'force-dynamic';

/** GET /api/catalog — public endpoint returning all repair catalog data */
export async function GET() {
  try {
    await connectDB();

    const [categories, brands, devices, services] = await Promise.all([
      RepairCategory.find({ status: 'active' }).sort({ order: 1, name: 1 }).lean().exec(),
      Brand.find({ status: 'active' }).populate('category').sort({ order: 1, name: 1 }).lean().exec(),
      Device.find({ status: 'active' }).sort({ order: 1, name: 1 }).lean().exec(),
      RepairService.find({ status: 'active' }).populate('serviceTemplate').sort({ order: 1, name: 1 }).lean().exec(),
    ]);

    return jsonWithCors({
      ok: true,
      categories: categories.map((c: any) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        status: c.status,
        order: c.order,
      })),
      brands: brands.map((b: any) => ({
        _id: String(b._id),
        name: b.name,
        slug: b.slug,
        logo: b.logo,
        category: b.category ? String(b.category._id || b.category) : undefined,
        categoryName: b.category?.name,
        categorySlug: b.category?.slug,
        status: b.status,
        order: b.order,
      })),
      devices: devices.map((d: any) => ({
        _id: String(d._id),
        brand: String(d.brand),
        brandName: d.brand?.name,
        brandSlug: d.brand?.slug,
        name: d.name,
        slug: d.slug,
        image: d.image,
        status: d.status,
        order: d.order,
      })),
      services: services.map((s: any) => ({
        _id: String(s._id),
        device: String(s.device),
        serviceTemplate: String(s.serviceTemplate?._id || s.serviceTemplate),
        deviceName: s.device?.name,
        deviceSlug: s.device?.slug,
        name: s.name,
        slug: s.slug,
        icon: s.icon,
        price: s.price,
        discountPrice: s.discountPrice,
        estimatedTime: s.estimatedTime,
        status: s.status,
        order: s.order,
      })),
    });
  } catch (err) {
    console.error('[api GET /api/catalog]', err);
    return jsonWithCors({ ok: false, error: 'Could not load catalog.' }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return handleOptions();
}
