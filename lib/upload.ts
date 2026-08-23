import { slugify } from "@/lib/utils";

export type UploadResult = {
  url: string;
  publicId: string;
};

/** Upload an image via the existing Cloudinary signed-upload flow. */
export async function uploadCatalogImage(
  file: File,
  folder = "itechnick-repair-catalog"
): Promise<UploadResult> {
  const signRes = await fetch(`/api/uploads/sign?folder=${encodeURIComponent(folder)}`);
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error || "Could not prepare upload.");

  const data = new FormData();
  data.append("file", file);
  data.append("api_key", sign.apiKey);
  data.append("timestamp", String(sign.timestamp));
  data.append("folder", sign.folder);
  data.append("signature", sign.signature);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body: data }
  );
  const uploaded = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploaded.error?.message || "Image upload failed.");

  return {
    url: uploaded.secure_url as string,
    publicId: uploaded.public_id as string,
  };
}

export function autoSlugFromName(name: string): string {
  return slugify(name);
}
