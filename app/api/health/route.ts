import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, getDbUri } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/health — quick status check for the API and database. */
export async function GET() {
  let connected = false;
  try {
    await connectDB();
    connected = mongoose.connection.readyState === 1;
  } catch (err) {
    console.error("[api GET /api/health]", err);
  }

  return NextResponse.json({
    ok: connected,
    db: connected ? "connected" : "unavailable",
    uri: getDbUri(),
    time: new Date().toISOString(),
  });
}