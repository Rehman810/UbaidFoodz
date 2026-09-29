# Restaurant OS

White-label ordering storefront and kitchen admin. Restaurant name, city, currency, hours, and contact details come from Settings or the demo seed — not from the code.

## Onboard a restaurant (about 10 minutes)

1. Install Node.js 18+ and Docker.
2. From the repo root:

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Set `JWT_SECRET` in `backend/.env` to a random string of at least 32 characters.
4. Start Postgres, migrate, and seed:

```bash
docker compose up -d
npm run prisma:migrate
npm run seed:demo -- --name "Pizza Hub" --city "Lahore" --currency PKR --timezone Asia/Karachi
```

The seed prints a random admin password **once**. A second run updates the name and city and does not reset that password.

5. Start the app:

```bash
npm run dev:backend
npm run dev:frontend
```

API: http://localhost:4000  
Storefront: http://localhost:3000  
Staff sign-in: http://localhost:3000/admin/login  
Customer sign-in: http://localhost:3000/login

6. Sign in as admin and open **Settings**. Set the phone, address, logo, colors, currency, and hours. The storefront title, footer, and receipts follow those values without a redeploy.

`RESTAURANT_ID` in the API env selects which restaurant this deployment serves. The default id is created by the migration. One process is one restaurant; every menu, order, and settings query is still filtered by that id.

## Stack

- Frontend: Next.js 14, TypeScript, Tailwind
- Backend: Express, TypeScript
- Database: PostgreSQL, Prisma

## Scripts

```bash
npm run dev          # Docker, migrate, seed, API, and web
npm test             # unit tests
npm run typecheck
```

Check dishes missing images:

```bash
npm run check:images -w restaurant-os-api
```

## Deploy notes

Backend CI is `.github/workflows/backend.yml`. Set `ORACLE_APP_DIR` to the directory on the server that contains this repo. Frontend deploys (Vercel) need `NEXT_PUBLIC_API_URL` pointing at the API. Do not commit `.env`.
