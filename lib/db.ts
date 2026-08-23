import dns from "dns";
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mobile_repair_shop";

const CONNECTION_OPTIONS = {
  bufferCommands: false,
  connectTimeoutMS: 10000, // time to establish a TCP connection (increased from 5000)
  serverSelectionTimeoutMS: 15000, // how long to wait for a usable MongoDB node (increased from 8000)
  socketTimeoutMS: 45000, // socket timeout (added)
};

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // Reuse the connection across hot reloads in development.
  // eslint-disable-next-line no-var
  var mongooseCache: Cached | undefined;
}

let cached: Cached = global.mongooseCache || { conn: null, promise: null };
globalThis.mongooseCache = cached;

let dnsOverridden = false;

/**
 * Some networks (e.g. corporate DNS filters) refuse DNS SRV lookups from
 * Node's resolver, which `mongodb+srv://` connection strings depend on.
 * We first try the OS resolver; if the SRV lookup fails we switch Node's
 * resolver to public DNS servers (overridable via DNS_SERVERS).
 */
async function ensureSrvResolvable(): Promise<void> {
  if (dnsOverridden || !MONGODB_URI.startsWith("mongodb+srv://")) return;

  let host: string | undefined;
  try {
    host = new URL(MONGODB_URI).hostname;
  } catch {
    return;
  }
  if (!host) return;
  const srvHost = `_mongodb._tcp.${host}`;

  try {
    await dns.promises.resolveSrv(srvHost);
  } catch {
    const servers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length > 0) {
      dns.setServers(servers);
      dnsOverridden = true;
      console.warn(
        `[db] OS DNS refused SRV lookup; using explicit DNS servers: ${servers.join(", ")}`
      );
    }
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    await ensureSrvResolvable();
    cached.promise = mongoose.connect(MONGODB_URI, CONNECTION_OPTIONS);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow a future retry
    throw err;
  }

  return cached.conn;
}

export function getDbUri(): string {
  const uri = MONGODB_URI.replace(/\/\/.*@/, "//***:***@"); // hide credentials
  return uri;
}