<p align="center">
  <img src="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png" alt="Next.js" width="80" height="80" />
</p>

<h1 align="center">Stock Management System</h1>

<p align="center">
  A warehouse/distribution stock and sales management system built for Indian businesses.<br/>
  Manage products, customers, sales, inventory alerts, and staff — all with organization-level data isolation.
</p>

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma 6, PostgreSQL
- **Auth**: NextAuth v4 (JWT strategy, credentials provider)
- **State**: TanStack Query, Zustand
- **Validation**: Zod v4
- **Notifications**: Sonner (toasts)

## Features

- **Products** — CRUD with SKU, barcode, cost/selling price, stock tracking, units (piece, box, kg, etc.)
- **Categories & Tax Rates** — Organize products, GST tax rates (0%, 5%, 12%, 18%, 28%)
- **Customers** — Manage customer details with GSTIN support
- **Sales** — Create sales with line items, automatic tax calculation, payment tracking (Cash, UPI, Bank Transfer, Cheque)
- **Inventory Alerts** — Low stock and out-of-stock notifications
- **Role-Based Access Control** — Users, Roles, Permissions (Admin, Staff, Viewer)
- **Multi-Tenancy** — Organization-scoped data isolation (planned)

---

## About Next.js

[Next.js](https://nextjs.org/) is a React framework for building full-stack web applications. This project uses **Next.js 16** with the **App Router**.

### What Next.js provides in this project

- **App Router** (`src/app/`) — File-based routing. Each folder becomes a URL path. A `page.tsx` file inside a folder makes it a route.
  - `/app/login/page.tsx` → renders at `/login`
  - `/app/products/[id]/page.tsx` → renders at `/products/abc123` (dynamic route)
- **API Routes** (`src/app/api/`) — Backend endpoints that run on the server. No separate Express/Fastify server needed.
  - `/app/api/products/route.ts` → handles `GET /api/products` and `POST /api/products`
  - Export `GET`, `POST`, `PUT`, `DELETE` functions from `route.ts`
- **Server Components** — Pages are server-rendered by default. They can directly fetch data, query the database, and send HTML to the client. No loading spinners for initial page load.
- **Layouts** (`layout.tsx`) — Shared UI that wraps child pages. The dashboard layout adds the sidebar; the auth layout centers the form.
- **Route Groups** (`(auth)`, `(dashboard)`) — Folders with `()` organize routes without affecting the URL. `/app/(dashboard)/products/page.tsx` renders at `/products`, not `/dashboard/products`.
- **Middleware** (`src/middleware.ts`) — Runs before every request. Used here to redirect unauthenticated users to `/login`.

### Key Commands

```bash
npm run dev       # Start dev server with hot reload (http://localhost:3000)
npm run build     # Create production build (checks TypeScript errors)
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## About Prisma (Database ORM)

[Prisma](https://www.prisma.io/) is a TypeScript ORM that provides type-safe database access, schema management, and migrations. This project uses **Prisma 6** with **PostgreSQL**.

### How Prisma works

1. **Schema** (`prisma/schema.prisma`) — You define your database models here. Prisma generates TypeScript types and a client from this file.
2. **Client** (`@prisma/client`) — Auto-generated, type-safe query builder. Imported via `src/lib/db.ts`.
3. **Migrations** — Prisma tracks schema changes and generates SQL migration files to evolve your database.

### Prisma Commands

#### Generate the client (after schema changes)

```bash
npx prisma generate
```

This reads `prisma/schema.prisma` and generates the TypeScript client in `node_modules/.prisma/client/`. Run this after every schema change so your code gets updated types.

#### Create a migration (development)

```bash
npx prisma migrate dev --name describe-your-change
```

This does three things:
1. Compares your `schema.prisma` with the current database
2. Generates a SQL migration file in `prisma/migrations/`
3. Applies the migration to your database and runs `prisma generate`

Example:
```bash
# After adding a new model or field to schema.prisma
npx prisma migrate dev --name add-organization-table
# Creates: prisma/migrations/20260414_add_organization_table/migration.sql
```

#### Apply migrations (production / CI)

```bash
npx prisma migrate deploy
```

Applies all pending migrations. Does NOT generate new migrations — only runs existing ones. Use this in production or CI/CD pipelines.

#### Reset the database (development only)

```bash
npx prisma migrate reset
```

Drops the database, re-creates it, runs all migrations, and runs the seed script. Useful when you want a clean start. **WARNING: Deletes all data.**

#### Seed the database

```bash
npx prisma db seed
```

Runs the seed script defined in `prisma/seed.ts`. This creates:
- Default permissions (products.view, products.create, etc.)
- Default roles (Admin, Staff, Viewer) with permission mappings
- Admin user (admin@stock.com / admin123)
- Sample categories and GST tax rates

The seed command is configured in `package.json` under `prisma.seed`.

#### View database in browser (Prisma Studio)

```bash
npx prisma studio
```

Opens a GUI at `http://localhost:5555` where you can browse and edit your database tables directly. Great for debugging.

#### Push schema without migration (prototyping)

```bash
npx prisma db push
```

Syncs `schema.prisma` directly to the database without creating a migration file. Useful for quick prototyping, but **do not use in production** — use `migrate dev` instead so changes are tracked.

#### Check migration status

```bash
npx prisma migrate status
```

Shows which migrations have been applied and which are pending.

### Schema change workflow

1. Edit `prisma/schema.prisma` (add/modify models or fields)
2. Run `npx prisma migrate dev --name your-change-name`
3. Prisma generates migration SQL + updates the TypeScript client
4. Update your service/route code to use the new fields
5. Commit both the `schema.prisma` and `prisma/migrations/` folder

### Environment variable

Prisma needs a PostgreSQL connection string in `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/stock_db?schema=public"
```

Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`

---

## Project Structure

```
src/
├── app/                      # Pages (App Router) + API routes
│   ├── (auth)/               #   Auth pages (login, register)
│   ├── (dashboard)/          #   Dashboard pages (products, sales, etc.)
│   │   ├── products/
│   │   │   ├── page.tsx      #     Product list page
│   │   │   ├── new/page.tsx  #     Create product page
│   │   │   ├── [id]/page.tsx #     Product detail (dynamic route)
│   │   │   └── components/   #     Product-specific components
│   │   └── ...
│   └── api/                  #   REST API endpoints
│       ├── products/route.ts #     GET /api/products, POST /api/products
│       └── ...
├── components/               # Shared UI components
│   ├── ui/                   #   shadcn/ui primitives (button, input, dialog, etc.)
│   └── layout/               #   Header, sidebar, page-header
├── services/                 # Backend services (Prisma queries)
│   ├── product.service.ts    #   Product CRUD operations
│   ├── sale.service.ts       #   Sale operations
│   └── ...
├── lib/                      # Utilities and config
│   ├── db.ts                 #   Prisma client singleton
│   ├── auth-options.ts       #   NextAuth configuration
│   ├── permissions.ts        #   Auth helper (requirePermission, requireAuth)
│   ├── constants/            #   Enums, permission names, role definitions
│   ├── validations/          #   Zod schemas for request validation
│   └── locales/              #   i18n translation strings
├── types/                    # TypeScript type definitions
├── hooks/                    # Custom React hooks
├── providers/                # React context providers (auth, query)
├── store/                    # Zustand state stores
├── styles/                   # CSS / Tailwind
│   └── globals.css
└── middleware.ts              # Route protection (redirect to /login if not authenticated)

prisma/
├── schema.prisma             # Database schema (models, relations, enums)
├── seed.ts                   # Seed script (default data)
└── migrations/               # Auto-generated SQL migration files
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd stock
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL` in `.env` to your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/stock_db?schema=public"
   ```

4. Run database migrations and seed
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Default Login

- **Email**: admin@stock.com
- **Password**: admin123

## License

Private
