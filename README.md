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
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose up -d
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

## Backend CI/CD (GitHub Actions → Oracle server)

Workflow: [`.github/workflows/backend.yml`](.github/workflows/backend.yml)

| Event | What happens |
| --- | --- |
| **Pull request** to `main` | CI only — build, migrate, smoke-test `/health` |
| **Push** to `main` | CI, then **SSH deploy** to your Oracle server |

Deploy script: [`scripts/deploy-backend.sh`](scripts/deploy-backend.sh) — `git pull` → `npm install` → `prisma migrate deploy` → `npm run build` → restart **pm2** or **systemd**.

### One-time: GitHub secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → add:

| Secret | Your Oracle server |
| --- | --- |
| `ORACLE_SSH_HOST` | `80.225.219.189` |
| `ORACLE_SSH_USER` | `ubuntu` |
| `ORACLE_APP_DIR` | `/home/ubuntu/UbaidFoodz` |
| `ORACLE_SSH_PRIVATE_KEY` | Contents of your `.key` file (entire PEM, including `BEGIN`/`END` lines) |
| `API_SERVICE_NAME` | `backend` (optional — this is the default pm2 name on your VM) |

Copy the private key into the secret (do not commit it):

```bash
cat "/home/abdulrehman/oracle keys/ssh-key-2026-09-22.key"
```

Paste the full output into `ORACLE_SSH_PRIVATE_KEY` in GitHub.

Until these secrets are set, **push to `main` runs CI only** — nothing is deployed.

Your server already has pm2 process **`backend`** running from `/home/ubuntu/UbaidFoodz/backend`. Each deploy runs `git pull`, `prisma migrate deploy`, `npm run build`, then `pm2 restart backend`.

**Important:** Push this workflow to the same GitHub repo the server pulls from (`Rehman810/UbaidFoodz`).

Manual deploy on the server: `bash scripts/deploy-backend.sh`  
Manual workflow: **Actions** → **Backend CI/CD** → **Run workflow**.

## Deploy (Render + Vercel, no paid Shell)

### Backend on Render

1. Create a **Web Service** from this repo.
2. Set **Root Directory** to `backend`.
3. **Build command:** `npm install && npx prisma generate`
4. **Start command** (runs migrate + seed automatically — no Shell needed):

   ```bash
   npx prisma migrate deploy && npx tsx prisma/seed.ts && npx tsx src/index.ts
   ```

5. Add env vars:
   - `DATABASE_URL` — from Neon (or your Postgres host)
   - `JWT_SECRET` — any long random string
   - `CLIENT_URL` — your Vercel frontend URL (e.g. `https://your-app.vercel.app`)

The seed script skips if demo data already exists. To reset, set `FORCE_SEED=1` and redeploy.

### Frontend on Vercel

1. Import repo, set **Root Directory** to `frontend`.
2. Add env var: `NEXT_PUBLIC_API_URL=https://ubaidfoodz.onrender.com` (your Render URL).
3. Redeploy.

**Keep Render awake (free tier):** Render sleeps after ~15 min idle. This repo includes:
- **GitHub Actions** — `.github/workflows/keep-render-awake.yml` pings `/health` every 10 min (push to GitHub; optional secret `RENDER_API_URL`).
- **Browser** — frontend pings `/health` every 10 min while any tab is open.
- **`/api/keep-alive`** — optional manual ping route on Vercel (no cron on Hobby; Vercel Cron needs Pro for schedules more than once/day).

You can also use [UptimeRobot](https://uptimerobot.com) (free) to monitor `https://your-api.onrender.com/health` every 5 minutes. Set **request timeout to 60 seconds** (Render free cold starts can take ~30s). Optional keyword: `"ok":true`.

**Seed data on Render (one-time):** In Render Shell run `npx tsx prisma/seed.ts`, or temporarily add it to start command for first deploy only.
