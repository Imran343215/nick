# PhoneFix Pro — Mobile Repair Shop Landing Page

A production-ready **Next.js 15 (App Router)** + **TypeScript** landing page for a
mobile repair shop with a **MongoDB (Mongoose)** backend. Visitors can **query the
shop** by submitting repair enquiries (stored in MongoDB with a tracking ID), look up
their submissions, and track repair orders.

## Features

| Area | What it does |
| --- | --- |
| Landing page | Sticky nav, hero, services, how-it-works, testimonials, contact, footer |
| Services | Rendered live from MongoDB (`GET /api/services`), seeded with `npm run seed` |
| Query form | Visitors submit a repair enquiry → stored in Mongo with a tracking ID (`POST /api/queries`) |
| Query lookup | `GET /api/queries?email=..&phone=..` or `?trackingId=..` to see submitted queries |
| Track repair | `POST /api/repair-status` with a tracking ID → order status + timeline |
| Admin | `/admin` page lists all queries, updates their status, deletes entries |
| Health | `GET /api/health` reports DB connectivity |

## Tech Stack

- **Next.js 15** (App Router, server + client components, route handlers)
- **TypeScript** (strict)
- **MongoDB** via **Mongoose 8** (cached connection, `globalThis` safe for dev hot reload)
- Custom CSS (no extra styling dependencies)

## Prerequisites

- Node.js **18.18+** (tested on Node 24)
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure the database
#    Edit .env.local (already created) — or copy the example:
cp .env.local.example .env.local
#    Local MongoDB:
#      MONGODB_URI=mongodb://127.0.0.1:27017/mobile_repair_shop
#    MongoDB Atlas:
#      MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/

# 3. Seed the database (services + demo repair order)
npm run seed

# 4. Optional: also add a sample visitor query (the admin page will show it)
npm run seed --demo

# 5. Start the dev server
npm run dev
```

## Store and Stripe setup

Add these server-side environment variables in `.env.local` and Vercel:

```dotenv
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

Create a Stripe webhook pointing to
`https://your-domain.vercel.app/api/stripe/webhook` and enable the
`checkout.session.completed` event. Sign in at `/admin`, choose **Manage store
products**, upload a product image, and add the phone. Customers can browse
`/store` and pay through Stripe Checkout.

Open **http://localhost:3000** for the landing page and
**http://localhost:3000/admin** for the query inbox.

## DNS note for `mongodb+srv://` connections

`mongodb+srv://` connection strings rely on a DNS **SRV** lookup. Some
networks/corporate DNS servers refuse those lookups from Node's resolver
(you may see `querySrv ECONNREFUSED`). The app handles this automatically:

1. It first tries the OS resolver.
2. If the SRV lookup fails, it switches Node's resolver to public DNS
   servers (`1.1.1.1, 8.8.8.8`) and logs a warning like:
   `[db] OS DNS refused SRV lookup; using explicit DNS servers: 1.1.1.1, 8.8.8.8`.

You can override the fallback servers with an env var:

```bash
DNS_SERVERS=1.1.1.1,8.8.8.8 npm run dev
```

## API Reference

### `GET /api/services`
Returns the repair service catalog from MongoDB.

```json
{ "ok": true, "count": 6, "services": [ ... ] }
```

### `POST /api/queries`
Creates a repair query. Body (all plain form fields):

```json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "phone": "+1 555 0100",
  "deviceBrand": "Apple",
  "deviceModel": "iPhone 15 Pro",
  "issue": "Broken / cracked screen",
  "message": "Dropped it yesterday — glass is shattered.",
  "preferredDate": "2026-09-01"
}
```

Response includes the generated tracking ID:

```json
{ "ok": true, "query": { "trackingId": "MRP-XXXX-XXXXXX", "status": "new", ... } }
```

### `GET /api/queries`
Query options:

| Query parameter | Description |
| --- | --- |
| `?email=you@example.com` | Visitor lookup — queries matching that email |
| `?phone=+15550100` | Visitor lookup — queries matching that phone |
| `?trackingId=MRP-XXXX-XXXXXX` | Look up a single query by tracking ID |
| *(no params)* | Latest 200 queries for the admin inbox |

### `DELETE /api/queries/:id`
Deletes a query (admin).

### `PATCH /api/queries/:id`
Updates a query status. Body: `{ "status": "quoted" }` — valid values:
`new | contacted | quoted | completed | closed`.

### `POST /api/repair-status`
Body: `{ "trackingId": "MRP-DEMO-1" }` returns the order, current status
description and full update timeline.

```json
{
  "ok": true,
  "order": {
    "trackingId": "MRP-DEMO-1",
    "customerName": "Demo Customer",
    "device": "Samsung Galaxy S23",
    "service": "Battery Replacement",
    "price": 49,
    "status": "repairing",
    "statusDescription": "The repair is in progress.",
    "etaDays": 1,
    "updates": [ ... ]
  }
}
```

Use **`MRP-DEMO-1`** to try the tracker on the landing page.

### `GET /api/health`
```json
{ "ok": true, "db": "connected", "uri": "mongodb://127.0.0.1:27017/mobile_repair_shop", "time": "..." }
```

## Project Structure

```
mobile-repair-shop/
├── app/
│   ├── page.tsx               # Landing page (server component)
│   ├── layout.tsx             # Root layout + metadata
│   ├── globals.css            # All styling (custom CSS)
│   ├── admin/page.tsx         # Query inbox admin UI
│   └── api/
│       ├── services/route.ts
│       ├── queries/route.ts
│       ├── queries/[id]/route.ts
│       ├── repair-status/route.ts
│       └── health/route.ts
├── components/                # Header, Hero, Services, QuoteForm, TrackRepair, ...
├── lib/
│   ├── db.ts                  # Mongoose connection (cached across hot reloads)
│   ├── services.ts            # Server-side service loader
│   └── utils.ts               # Tracking IDs, validation, helpers
├── models/
│   ├── Service.ts
│   ├── RepairQuery.ts         # Visitor enquiries
│   └── RepairOrder.ts         # Trackable repair orders
├── scripts/seed.mjs           # Seed script (idempotent)
└── .env.local                 # MONGODB_URI goes here
```

## Deployment

1. Create a **MongoDB Atlas** cluster and put its connection string into
   `.env.local` (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/mobile_repair_shop`).
2. Run `npm run build && npm start`, or deploy to Vercel with the same env var.
3. Never commit `.env.local` (it is git-ignored).