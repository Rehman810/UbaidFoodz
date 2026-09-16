# Ubaid Fast Foodz

Polished demo of a multi-role restaurant ordering platform (customer, kitchen admin, rider). Built to show a restaurant owner what a full system looks like — not a production deployment.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Express + TypeScript
- **Database:** PostgreSQL via Docker, Prisma ORM
- **Auth:** JWT, email + password (`customer` / `admin` / `rider`)

## Run locally

You need **Node.js 18+** and **Docker** (for PostgreSQL).

```bash
npm install
npm run dev
```

That script:

1. Starts Postgres with Docker Compose  
2. Applies Prisma migrations and seeds demo data  
3. Starts the API on [http://localhost:4000](http://localhost:4000)  
4. Starts the app on [http://localhost:3000](http://localhost:3000) (Next.js will use **3001** if 3000 is already taken)

Run `npm run dev` from the **repository root**. Docker must be running.

Stop with `Ctrl+C`. The database container keeps running; `npm run db:down` stops it.

## Demo logins

Password for all accounts: **`demo123`**

| Role | Email |
| --- | --- |
| Customer | `customer@ubaidfastfoodz.com` |
| Admin (kitchen) | `admin@ubaidfastfoodz.com` |
| Rider | `rider@ubaidfastfoodz.com` |

Credentials are also printed on the login screen.

## What to click through

1. **Customer:** landing → menu → add to cart → checkout (cash on delivery) → tracking  
2. **Admin:** dashboard stats + 7-day chart → change order status → assign a rider → edit menu  
3. **Rider:** assigned drops → mark delivered  
4. After **Delivered**, download the PDF invoice from the order (customer or admin)

## Manual commands

```bash
npm run db:up
npm run prisma:migrate
npm run prisma:seed
npm run dev:backend
npm run dev:frontend
```

## Notes

- Payment is a **Cash on Delivery** placeholder (no gateway).  
- Menu images are from Unsplash.  
- Invoices are generated with PDFKit into `backend/invoices/` when an order is marked delivered.
# UbaidFoodz
