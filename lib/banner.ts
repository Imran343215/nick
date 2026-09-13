import { connectDB } from "@/lib/db";
import BannerSlide from "@/models/BannerSlide";
import BannerSettings from "@/models/BannerSettings";

export type BannerSlideShape = {
  _id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  link?: string;
  status: "active" | "inactive";
  order: number;
};

export type BannerSettingsShape = {
  enabled: boolean;
  autoplaySeconds: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc = Record<string, any>;

export function serializeBannerSlide(doc: Doc): BannerSlideShape {
  return {
    _id: String(doc._id),
    imageUrl: doc.imageUrl as string,
    title: (doc.title as string) || undefined,
    subtitle: (doc.subtitle as string) || undefined,
    buttonLabel: (doc.buttonLabel as string) || undefined,
    link: (doc.link as string) || undefined,
    status: doc.status as BannerSlideShape["status"],
    order: Number(doc.order ?? 0),
  };
}

const DEFAULT_SETTINGS: BannerSettingsShape = { enabled: true, autoplaySeconds: 5 };

/** Public: active slides with a real image, in display order, plus carousel settings.
 * Never throws — falls back to an empty carousel (hidden on the site) if the DB is unreachable. */
export async function fetchPublicBanner(): Promise<{
  slides: BannerSlideShape[];
  settings: BannerSettingsShape;
}> {
  try {
    await connectDB();
    const [slideDocs, settingsDoc] = await Promise.all([
      BannerSlide.find({ status: "active", imageUrl: { $exists: true, $ne: "" } })
        .sort({ order: 1, createdAt: 1 })
        .lean()
        .exec(),
      BannerSettings.findById("banner").lean().exec(),
    ]);
    const slides = slideDocs.map((doc) => serializeBannerSlide(doc)).filter((s) => s.imageUrl);
    const settings: BannerSettingsShape = settingsDoc
      ? {
          enabled: settingsDoc.enabled !== false,
          autoplaySeconds: Math.min(15, Math.max(2, Number(settingsDoc.autoplaySeconds) || 5)),
        }
      : DEFAULT_SETTINGS;
    return { slides, settings };
  } catch (err) {
    console.error("[banner] could not load public banner:", err);
    return { slides: [], settings: DEFAULT_SETTINGS };
  }
}

export async function fetchAllBannerSlides(): Promise<BannerSlideShape[]> {
  await connectDB();
  const docs = await BannerSlide.find({}).sort({ order: 1, createdAt: 1 }).lean().exec();
  return docs.map((doc) => serializeBannerSlide(doc));
}

export async function fetchBannerSettings(): Promise<BannerSettingsShape> {
  await connectDB();
  const doc = await BannerSettings.findById("banner").lean().exec();
  return doc
    ? {
        enabled: doc.enabled !== false,
        autoplaySeconds: Math.min(15, Math.max(2, Number(doc.autoplaySeconds) || 5)),
      }
    : DEFAULT_SETTINGS;
}
