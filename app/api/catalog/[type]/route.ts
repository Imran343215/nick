import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Brand from '@/models/Brand';
import RepairCategory from '@/models/RepairCategory';
import Device from '@/models/Device';
import RepairService from '@/models/RepairService';

export const dynamic = 'force-dynamic';

/** GET /api/catalog/[type] — public endpoint for repair catalog data */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    await connectDB();

    switch (type) {
      case 'categories': {
        const docs = await RepairCategory.find({ status: 'active' })
          .sort({ order: 1, name: 1 }).lean().exec();
        return NextResponse.json({
          ok: true,
          categories: docs.map((c: any) => ({
            _id: String(c._id), name: c.name, slug: c.slug, icon: c.icon,
            status: c.status, order: c.order,
          })),
        });
      }
      case 'brands': {
        const categoryId = new URL(request.url).searchParams.get('category');
        const filter: any = { status: 'active' };
        if (categoryId) filter.category = categoryId;
        const docs = await Brand.find(filter).populate('category')
          .sort({ order: 1, name: 1 }).lean().exec();
        return NextResponse.json({
          ok: true,
          brands: docs.map((b: any) => ({
            _id: String(b._id), name: b.name, slug: b.slug, logo: b.logo,
            category: b.category ? String(b.category._id || b.category) : undefined,
            categoryName: b.category?.name, categorySlug: b.category?.slug,
            status: b.status, order: b.order,
          })),
        });
      }
      case 'devices': {
        const brandId = new URL(request.url).searchParams.get('brand');
        const filter: any = { status: 'active' };
        if (brandId) filter.brand = brandId;
        const docs = await Device.find(filter).sort({ order: 1, name: 1 }).lean().exec();
        return NextResponse.json({
          ok: true,
          devices: docs.map((d: any) => ({
            _id: String(d._id), brand: String(d.brand), name: d.name,
            slug: d.slug, image: d.image, status: d.status, order: d.order,
          })),
        });
      }
      case 'services': {
        const deviceId = new URL(request.url).searchParams.get('device');
        const filter: any = { status: 'active' };
        if (deviceId) filter.device = deviceId;
        const docs = await RepairService.find(filter).populate('serviceTemplate')
          .sort({ order: 1, name: 1 }).lean().exec();
        return NextResponse.json({
          ok: true,
          services: docs.map((s: any) => ({
            _id: String(s._id), device: String(s.device),
            serviceTemplate: String(s.serviceTemplate?._id || s.serviceTemplate),
            name: s.name, slug: s.slug, icon: s.icon,
            price: s.price, discountPrice: s.discountPrice,
            estimatedTime: s.estimatedTime, status: s.status, order: s.order,
          })),
        });
      }
      default:
        return NextResponse.json({ ok: false, error: 'Unknown type.' }, { status: 404 });
    }
  } catch (err) {
    console.error(`[api GET /api/catalog/${(params as any)?.type}]`, err);
    return NextResponse.json({ ok: false, error: 'Could not load data.' }, { status: 500 });
  }
}
