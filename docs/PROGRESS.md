# StockSense — Team Progress & Handoff Log

> This document tracks the sequential delivery of StockSense across all 3 team members.  
> Each member appends their completed features, verification results, and explicit handoff notes when concluding their stage.

---

## Member 1 — Foundation, Auth, Master Data & UI Kit

### 1. Summary of Delivered Work
Member 1 has completed the entire core foundation, data persistence layer, authentication security model, settings and user management, shared stock services, real-time SSE telemetry, and universal frontend UI kit.

- **Monorepo & Engineering Architecture:**
  - Express 5 REST backend in ESM (`"type": "module"`) running on port `5000`.
  - React 19 + Vite frontend running on port `5173` with proxy forwarding `/api` to `5000`.
  - Tailwind CSS v4 via `@tailwindcss/vite` with `@theme` design tokens and class-based dark mode.
  - PostgreSQL 18 with complete, validated Prisma ORM schema (`schema.prisma`) and initial migration.
  - Idempotent database seed script (`prisma/seed.js`) generating admin, manager, staff, 2 warehouses, and 8 physical/virtual locations.
  - Full documentation suite in `/docs`: `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `API.md`, `DECISIONS.md`, `CONTRIBUTING.md`, `PROGRESS.md`.

- **Core Services & Backend Infrastructure:**
  - `services/stock.service.js`: Atomic conditional decrements (`WHERE quantity >= $demand`) preventing negative stock; dynamic `Free to Use` availability calculation (`On Hand - Reserved`); double-entry `StockMove` ledger entries.
  - `services/sequence.service.js`: Concurrency-safe atomic reference auto-incrementation per warehouse (`<WH>/<IN|OUT|INT|ADJ>/<0001>`).
  - `lib/eventBus.js` & `modules/events`: Server-Sent Events (SSE) streaming live updates (`stock.changed`, `operation.changed`, `notification.created`) with a 25-second keepalive heartbeat.
  - `lib/activity.js`: Audit logging service.
  - `middleware/auth.js` & `rbac.js`: 8-hour httpOnly cookie session with strict role guards (`ADMIN`, `MANAGER`, `STAFF`).
  - `middleware/validate.js`: Express 5 Zod request validator storing parsed parameters on `req.valid`.
  - `middleware/errorHandler.js`: Normalized JSON error envelopes with Prisma and Zod error mapping.

- **Authentication & Security:**
  - Login accepting either `loginId` or `email` plus `password`. Invalid credentials return `"Invalid Login Id or Password"`.
  - Signup with strict validation (6–12 char loginId, > 8 char password with uppercase, lowercase, special character).
  - 3-step OTP password reset with 6-box input, 60s resend timer, and server console fallback for offline/air-gapped environments.
  - `/profile` page for editing display name, email, and changing password.

- **Settings & Master Data Management:**
  - Warehouses CRUD (`/settings/warehouses`) with default location assignment and stock deletion safeguards.
  - Locations CRUD (`/settings/locations`) with warehouse linkage, full name formatting (`WH/Stock`), and stock deletion safeguards.
  - User Management (`/settings/users`) restricted to `ADMIN` with role assignment and self-demotion/deactivation safeguards. Non-admins receive `403 Forbidden`.
  - Activity Audit Log (`/settings/activity`) with user, entity type, and date filters.

- **Frontend Foundation & UI Kit Overhaul:**
  - Modern, high-density SaaS design system matching Linear/Stripe/Vercel/Odoo 17 aesthetics in `client/src/index.css` via Tailwind v4 `@theme`.
  - Sizing rule enforced across the entire application: Crisp **36px** on desktop (`md:min-h-[36px] md:h-9`), but touch-friendly **at least 40px** (`min-h-[40px]`) below `md` breakpoint.
  - Soft pill badges with status dot indicators and 1px rings (`ring-1 ring-emerald-600/20`, etc.).
  - 256px $\leftrightarrow$ 64px collapsible icon rail with `localStorage` persistence and Tooltip hover labels.
  - Topbar with input-styled search button (`"Search products, references... Ctrl K"`), theme toggle, notification bell, and user avatar.
  - Auth layout with rich teal gradient split screen, live feature points, and high-contrast form card.
  - Live 4-point password security checklist (length > 8, lowercase, uppercase, special character) with real-time checkmarks on Signup and Profile views.
  - Password visibility toggles (Eye / EyeOff) across Login, Signup, Forgot Password, and Profile pages.
  - 6-box OTP input with multi-digit clipboard paste handling and auto-focus in Forgot Password flow.
  - Sonner toast system customized with theme tokens, soft borders, and dark mode support.
  - Settings views (`Warehouses`, `Locations`, `Users`, `Activity`) equipped with `DataTable` skeleton loaders, rich `EmptyState`, and retryable `ErrorState`.
  - Friendly `404 Not Found` and `403 Access Denied` error pages with back navigation.
  - Dedicated Component Showcase route at **`/dev/ui`** displaying every component, variant, and state in both light and dark mode.
  - 20+ accessible, dark-mode ready UI components in `client/src/components/ui/` with exhaustive props documentation in `client/src/components/ui/README.md`.

---

### 2. Automated & Manual Verification Results

| Check / Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **Prisma Migration & Seed** | Clean DB initialization; idempotent re-runs | Seeds 3 users, 3 virtual locs, 2 warehouses, 5 internal locs | **PASS** |
| **API Health Check** | `GET /api/health` returns 200 with status: ok, db: ok | `{ success: true, data: { status: 'ok', db: 'ok' } }` | **PASS** |
| **Login Validation** | Wrong credentials return 401 with standard error | Returns 401 `"Invalid Login Id or Password"` | **PASS** |
| **Admin Session & RBAC** | `admin01` login sets httpOnly cookie; can access `/api/users` | Cookie set; returns 3 users | **PASS** |
| **Staff RBAC Protection** | `staff001` login cannot access `/api/users` | API returns 403 Forbidden; UI renders `<ForbiddenPage />` | **PASS** |
| **Console OTP Delivery** | `/api/auth/forgot-password` prints 6-digit OTP | Formatted email box printed to server console with 10m expiry | **PASS** |
| **Warehouses & Locations API** | Lists warehouses and formatted locations | Returns `WH`, `WH2`, `WH/STOCK`, `WH/RACK-A`, `WH/PROD`, etc. | **PASS** |
| **Frontend Production Build** | `npm run build` inside `client/` | Vite builds production bundle with zero errors in 1.77s | **PASS** |
| **ESLint Validation** | `npm run lint` across monorepo | Server and client pass with 0 errors and 0 warnings | **PASS** |

---

### 3. Explicit Notes for Member 2 (Operations, Contacts & Move History)

Welcome, Member 2! The entire foundation is ready. You can now build the Operations module directly on top of this infrastructure.

#### A. Services Available for Your Operations Logic
1. **`services/sequence.service.js`**:
   - Call `nextReference(tx, warehouseId, type)` inside your Prisma transaction when creating a receipt, delivery, transfer, or adjustment.
   - It will atomically return reference strings like `WH/IN/0001`, `WH/OUT/0001`, `WH/INT/0001`, `WH/ADJ/0001`.
2. **`services/stock.service.js`**:
   - **`checkAvailability(operation, tx?)`**:
     - Call this during the Delivery order flow (`/api/operations/:id/check-availability` or when moving from `DRAFT` $\rightarrow$ `READY`).
     - Returns `[{ lineId, productId, required, available, shortBy }]`. If any line has `shortBy > 0`, the operation should move to `WAITING` status and highlight the shortage in red in the UI.
   - **`applyMoves(tx, { moves, reference, type, operationId, userId })`**:
     - Call this inside a `prisma.$transaction` when validating an operation (`POST /api/operations/:id/validate`).
     - Pass the moves array: `[{ productId, fromLocationId, toLocationId, quantity, unitCost, operationLineId }]`.
     - Automatically verifies stock, decrements from source, increments to destination, and writes immutable rows into `StockMove`.
     - Throws `InsufficientStockError` if stock is unavailable.
   - **`getVirtualLocation(type, tx?)`**:
     - Use `getVirtualLocation('VENDOR')` for Receipt source.
     - Use `getVirtualLocation('CUSTOMER')` for Delivery destination.
     - Use `getVirtualLocation('ADJUSTMENT')` for Inventory Adjustments.
3. **Event Emitting (`lib/eventBus.js`)**:
   - **Important:** Emit events **only after** your database transaction commits:
     ```js
     eventBus.emit('operation.changed', { id: op.id, type: op.type, status: op.status });
     eventBus.emit('stock.changed', { productIds, locationIds });
     ```

#### B. Placeholder Files to Replace
The following files are already routed and connected; simply implement your business logic and UI inside them:
- **Backend Modules (Currently stub routers returning 501):**
  - `server/src/modules/contacts/` (`contacts.routes.js`, create controller/service/schema)
  - `server/src/modules/operations/` (`operations.routes.js`, create controller/service/schema)
  - `server/src/modules/adjustments/` (`adjustments.routes.js`, create controller/service/schema)
- **Frontend Pages (Currently placeholder components):**
  - `client/src/pages/operations/ReceiptsPage.jsx` & `ReceiptFormPage.jsx`
  - `client/src/pages/operations/DeliveriesPage.jsx` & `DeliveryFormPage.jsx`
  - `client/src/pages/operations/TransfersPage.jsx` & `TransferFormPage.jsx`
  - `client/src/pages/operations/AdjustmentsPage.jsx` & `AdjustmentFormPage.jsx`
  - `client/src/pages/operations/PrintSlipPage.jsx`
  - `client/src/pages/contacts/ContactsPage.jsx`

#### C. Available Pre-Built UI Components
All components are in `client/src/components/ui/` (see `client/src/components/ui/README.md` for full props):
- `<StatusPipeline steps={[...]} currentStep={op.status} />`
- `<StatusBadge status={op.status} />`
- `<DirectionBadge type={op.type} />`
- `<DataTable columns={...} data={...} onRowClick={...} />`
- `<KanbanBoard columns={...} items={...} getItemColumnId={i => i.status} renderCard={...} />`
- `<Combobox options={...} value={...} onChange={...} placeholder="Search vendor/product..." />`
- `<SearchInput />`, `<FilterChips />`, `<ViewToggle view={view} onChange={setView} />`
- `<Button variant="primary|secondary|danger" loading={...} />`
- `<ConfirmDialog />`, `<Modal />`, `<Drawer />`

---

## Member 2 — Operations, Contacts & Movements
*(To be completed by Member 2)*

---

## Member 3 — Products, Stock, Dashboard & Intelligence
*(To be completed by Member 3)*
