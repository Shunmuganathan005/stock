# Multi-Tenancy: Organization-Scoped Data Isolation

## Context
Currently all users see all data — there's zero organization/tenant concept. When a new person registers, they should get their own isolated business. Their products, customers, sales, etc. must be invisible to other businesses.

**User choices:**
- Registration auto-creates a new Organization (owner becomes admin)
- Categories AND Tax Rates are per-org
- Roles & Permissions are per-org (each org defines its own roles)
- Staff are added by the owner (no public registration for staff)

---

## Phase 1: Schema Changes

**File: `prisma/schema.prisma`**

### 1a. New `Organization` model
```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  ownerId   String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner      User     @relation("OrgOwner", fields: [ownerId], references: [id])
  users      User[]   @relation("OrgMembers")
  roles      Role[]
  categories Category[]
  taxRates   TaxRate[]
  products   Product[]
  customers  Customer[]
  sales      Sale[]
  alerts     Alert[]
}
```

### 1b. Add `organizationId` to these models
| Model | Extra fields | Unique constraint change |
|-------|-------------|------------------------|
| User | `organizationId`, `isOwner Boolean @default(false)`, + two relations: `@relation("OrgMembers")` for membership, `@relation("OrgOwner")` for owned org | Keep `email @unique` globally |
| Role | `organizationId` | `@unique` on `name` → `@@unique([name, organizationId])` |
| Category | `organizationId` | `@unique` on `name` → `@@unique([name, organizationId])` |
| TaxRate | `organizationId` | `@unique` on `name` → `@@unique([name, organizationId])` |
| Product | `organizationId` | `@unique` on `sku` → `@@unique([sku, organizationId])` |
| Customer | `organizationId` | — |
| Sale | `organizationId` | `@unique` on `saleNumber` → `@@unique([saleNumber, organizationId])` |
| Alert | `organizationId` | — |

**NOT changed:** Permission (stays global), SaleItem, Payment (accessed via parent Sale).

### 1c. Migration strategy
1. Create Organization table
2. Add columns as **nullable** first
3. Create a "Default" org, backfill all existing rows
4. Make columns non-nullable, update unique constraints

---

## Phase 2: Auth Changes

> **Why both `jwt` and `session` callbacks?**
> The app uses `strategy: "jwt"` (see `src/lib/auth-options.ts` line 8). With JWT strategy, NextAuth uses two callbacks in sequence:
> 1. **`jwt` callback** — runs server-side on every request; enriches the token with data from DB (this is where we add `organizationId` and `isOwner` to the token).
> 2. **`session` callback** — maps the token fields onto `session.user` so client-side code (and API routes via `getServerSession`) can access them.
> Both are required because the token is the source of truth and the session is the client-facing view of it.

### `src/types/index.ts`
Add to `SessionUser`:
```ts
organizationId: string;
isOwner: boolean;
```

### `src/types/next-auth.d.ts`
Add `organizationId: string` and `isOwner: boolean` to `Session.user`.

### `src/lib/auth-options.ts`
- In `jwt` callback: fetch `fullUser.organizationId` and `fullUser.isOwner` from DB, store on token
- In `session` callback: copy `token.organizationId` and `token.isOwner` onto `session.user`

---

## Phase 3: Organization Bootstrap Service

**New file: `src/services/organization.service.ts`**

```ts
export async function createOrganization(data: {
  name: string; ownerName: string; ownerEmail: string; hashedPassword: string;
}): Promise<{ organization; user }>
```

Uses `prisma.$transaction` to atomically:
1. Create owner User (isOwner=true, Admin role) — user created first so we can set the relation
2. Create Organization with `ownerId` pointing to that user (via `owner` relation) and connect user as member (via `users` relation)
3. Create default Roles (Admin, Staff, Viewer) scoped to org, with permission mappings
4. Assign Admin role to owner user
5. Create default Categories (5) for org
6. Create default Tax Rates (5 GST rates) for org

Reuse the same PERMISSIONS/ROLES/TAX_RATES/CATEGORIES data currently in `prisma/seed.ts` — extract into shared constants.

---

## Phase 4: Service Layer — Add `orgId` to All Queries

**Pattern for every service function:**
```ts
// Before
export async function listProducts(params) {
  const where = { isActive: true };
  ...
}

// After
export async function listProducts(params, orgId: string) {
  const where = { isActive: true, organizationId: orgId };
  ...
}
```

**Files to update:**

| Service file | Functions to scope |
|---|---|
| `src/services/product.service.ts` | `listProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct` |
| `src/services/customer.service.ts` | `listCustomers`, `getCustomer`, `createCustomer`, `updateCustomer`, `deleteCustomer` |
| `src/services/sale.service.ts` | `listSales`, `getSale`, `createSale`, `getNextSaleNumber` |
| `src/services/alert.service.ts` | `listAlerts`, `getUnreadCount`, `markAsRead`, `markAllAsRead` |
| `src/services/category.service.ts` | `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| `src/services/user.service.ts` | `listUsers`, `getUser`, `updateUser`, `listRoles`, `createRole`, `updateRole`, `deleteRole` + new `addStaffUser()` |

**New file: `src/services/tax-rate.service.ts`**
Currently tax-rate routes use inline prisma calls. Extract to service with org scoping.

---

## Phase 5: API Route Changes

Every route extracts `user.organizationId` from session and passes it to services.

```ts
const user = await requirePermission("products.view");
const result = await listProducts(params, user.organizationId);
```

**20 route files to update:**

| Route | Pass orgId to |
|---|---|
| `api/products/route.ts` | listProducts, createProduct |
| `api/products/[id]/route.ts` | getProduct, updateProduct, deleteProduct |
| `api/customers/route.ts` | listCustomers, createCustomer |
| `api/customers/[id]/route.ts` | getCustomer, updateCustomer, deleteCustomer |
| `api/sales/route.ts` | listSales, createSale |
| `api/sales/[id]/route.ts` | getSale |
| `api/sales/next-number/route.ts` | getNextSaleNumber |
| `api/payments/route.ts` | recordPayment (verify sale belongs to org) |
| `api/categories/route.ts` | listCategories, createCategory |
| `api/categories/[id]/route.ts` | updateCategory, deleteCategory |
| `api/tax-rates/route.ts` | listTaxRates, createTaxRate |
| `api/tax-rates/[id]/route.ts` | updateTaxRate |
| `api/alerts/route.ts` | listAlerts |
| `api/alerts/unread-count/route.ts` | getUnreadCount |
| `api/alerts/[id]/read/route.ts` | markAsRead |
| `api/alerts/mark-all-read/route.ts` | markAllAsRead |
| `api/users/route.ts` | listUsers |
| `api/users/[id]/route.ts` | getUser, updateUser |
| `api/roles/route.ts` | listRoles, createRole |
| `api/roles/[id]/route.ts` | getRole, updateRole, deleteRole |

**Unchanged:** `api/permissions/route.ts` (global), `api/users/change-password/route.ts` (uses user.id)

---

## Phase 6: Registration Rewrite

### `src/app/api/register/route.ts`
- Add `businessName` to Zod schema (required)
- Instead of creating a user with a global "Staff" role:
  - Call `organizationService.createOrganization({ name: businessName, ownerName, ownerEmail, hashedPassword })`
- Returns the created user

### `src/app/(auth)/register/page.tsx`
- Add "Business Name" input field
- Send `businessName` in POST body
- Update page text: "Register your business" framing

### Localization: add new keys to `en.json`
- `auth.businessName`, `auth.businessNamePlaceholder`, etc.

---

## Phase 7: Staff Management

### New route: `src/app/api/users/invite/route.ts`
```
POST /api/users/invite
Body: { name, email, password, roleId }
Requires: users.manage permission
```
- Verify roleId belongs to caller's org
- Hash password, create user with orgId and isOwner=false

### `src/app/(dashboard)/settings/users/page.tsx`
- Add "Add Staff" button (only for users with `users.manage`)
- Dialog with: Name, Email, Password, Role (dropdown of org's roles)
- POST to `/api/users/invite`

### Localization: add new keys for staff invite UI

---

## Phase 8: Seed Script Update

### `prisma/seed.ts`
1. Permissions: still seeded globally (unchanged)
2. Create a "Default Organization"
3. Create roles (Admin/Staff/Viewer) scoped to that org
4. Create admin user in that org with isOwner=true
5. Create categories and tax rates scoped to that org

---

## Phase 9: Optional UI Polish

- Show org name in sidebar (under brand or in user footer)
- Dashboard layout: fetch org name from user relation, pass to Sidebar

---

## Summary of Changes

### New Files (4)
| File | Purpose |
|---|---|
| `src/services/organization.service.ts` | Create org + seed defaults |
| `src/services/tax-rate.service.ts` | Tax rate CRUD with org scoping |
| `src/app/api/users/invite/route.ts` | Add staff endpoint |
| Prisma migration (auto-generated) | Schema changes |

### Modified Files (~37)
- `prisma/schema.prisma`, `prisma/seed.ts`
- `src/types/index.ts`, `src/types/next-auth.d.ts`
- `src/lib/auth-options.ts`
- 7 service files (product, customer, sale, alert, category, user, payment)
- 20 API route files
- `src/app/api/register/route.ts`
- `src/app/(auth)/register/page.tsx`
- `src/app/(dashboard)/settings/users/page.tsx`
- `src/app/(dashboard)/layout.tsx`, `src/components/layout/sidebar.tsx`
- `src/lib/locales/en.json` (new keys)

---

## Verification
1. `npx prisma migrate dev` — migration applies cleanly
2. `npx prisma db seed` — seed works with new org structure
3. `npm run build` — no TypeScript errors
4. Register a new business → creates org + defaults → can only see own data
5. Login as admin@stock.com → sees only Default Org data
6. Add staff from Users page → staff sees same org's data
7. Register a second business → completely isolated from the first
