// Loads ".env.local" first (the Next.js-style naming the main site uses), then
// falls back to ".env". Values already set in the real environment always win,
// and neither file overrides another. Paths resolve relative to this file, so
// `npm start` works no matter which directory node was launched from.
//
// NOTE: static-import order in index.js matters — this module must be imported
// BEFORE ./db.js, which reads MONGODB_URI at module-evaluation time.
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
for (const name of [".env.local", ".env"]) {
  dotenv.config({ path: path.join(here, name) });
}