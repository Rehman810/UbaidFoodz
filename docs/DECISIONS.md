# Decisions

## One deployment, scoped data

There is a `Restaurant` row. Menu, categories, areas, orders, users, deals, banners, blocks, testimonials, and settings store `restaurantId`.

The API resolves the id from `RESTAURANT_ID`, then from a matching `Restaurant.hostname`, then from the migration default `11111111-1111-4111-8111-111111111111`. `AsyncLocalStorage` holds that id for the request. Prisma queries on tenant models add `restaurantId` on reads and writes, and refuse updates or deletes for another restaurant's row.

`User.email`, category name, area name, and order number stay globally unique. That is simpler for login and existing lookups. Two restaurants in one database must not reuse those values. Listing and mutation still cannot see another restaurant's rows.

## Currency display

Money stays in `Decimal(10,2)`. `formatMoney()` converts through integer minor units and prints zero fraction digits for PKR (`Rs 1,234`) and two digits for other codes. The symbol and code come from settings.

WhatsApp message formatting is unchanged. Messaging providers are out of scope.

## Seed password

`npm run seed:demo` hashes a random password and prints it once. If the admin user already exists, the password is not reset and is not printed again. Branding fields (name, city, currency, timezone) are updated.

Karachi neighbourhoods are seeded only when `--city` is Karachi. Any other city gets a short generic area list.

## Docker database name

Compose uses user `restaurant` and database `restaurant_os`. An existing volume created with the old demo credentials must be recreated (`docker compose down -v`) before `docker compose up`.

## Testimonials

The storefront does not ship fake reviews or a hardcoded rating. Published testimonials from Settings are shown. Live order-count stats appear only when `showLiveStats` is on and there are at least 10 non-cancelled orders.

## Staff sign-in

Customers use `/login`. Staff use `/admin/login`. A signed-in non-customer who opens `/login` is sent to their role home.
