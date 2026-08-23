import crypto from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ ok: false, error: "Cloudinary is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const requestedFolder = searchParams.get("folder")?.trim();
  const allowedFolders = ["itechnick-products", "itechnick-repair-catalog"];
  const folder =
    requestedFolder && allowedFolders.includes(requestedFolder)
      ? requestedFolder
      : "itechnick-products";

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  return NextResponse.json({ ok: true, cloudName, apiKey, timestamp, folder, signature });
}