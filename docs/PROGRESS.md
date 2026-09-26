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
> **Status:** Completed & Fully Verified  
> **Lead:** Member 2 (Senior Full-Stack Engineer)

### 1. Summary of Delivered Work
Member 2 has delivered the complete core logistics, inventory movement engine, contacts directory, and state-machine-driven operational workflows across both backend and frontend.

- **Contacts Module:**
  - Full CRUD with Zod validation (`createContactBody`, `updateContactBody`, `listContactsQuery`).
  - Validation rules: Name (2–100 chars), Type (`VENDOR`, `CUSTOMER`, `BOTH`), email format, 10-digit Indian mobile number (`^[6-9]\d{9}$`), and 15-character Indian GSTIN (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`).
  - Case-insensitive search across name, email, phone, and GSTIN.
  - Soft-delete pattern (`isActive: false`) restricted to `MANAGER` and `ADMIN` (`CAN.DELETE`).
  - Full UI at `/contacts` with tab filters (All / Vendors / Customers), search, create/edit modal, and quick "+ New Contact" modal directly inside operation documents.

- **Operations Engine & State Machines:**
  - Shared, high-performance service for `RECEIPT`, `DELIVERY`, and `INTERNAL` operations (`server/src/modules/operations/`).
  - State machine guarantees:
    - **RECEIPT:** `DRAFT` $\xrightarrow{\text{confirm ("To Do")}}$ `READY` $\xrightarrow{\text{validate}}$ `DONE`. Virtual `VENDOR` source to warehouse internal destination.
    - **DELIVERY:** `DRAFT` $\xrightarrow{\text{confirm}}$ `READY` (if full stock available) or `WAITING` (if short). `WAITING` $\xrightarrow{\text{check-availability}}$ `READY` when inventory is received. `READY` $\xrightarrow{\text{validate}}$ `DONE`. Internal warehouse source to virtual `CUSTOMER` destination.
    - **INTERNAL:** Same availability logic as Delivery. Source and destination must be physical internal locations and cannot be identical.
  - Idempotent Validation & Double-Claim Safeguard: Inside `prisma.$transaction`, validation begins with atomic conditional claim: `UPDATE "Operation" SET status='DONE' WHERE id=$id AND status='READY'`. If 0 rows are affected, throws `InvalidStateError` (409 Conflict), preventing concurrency race conditions.
  - Auto-Sequencing: Concurrency-safe reference generation (`nextReference`) assigning numbers like `WH/IN/0001`, `WH/OUT/0001`, `WH/INT/0001`.
  - Cancellation: Restricted to `MANAGER` and `ADMIN` (`CAN.CANCEL_OPERATION`). Unreserves any allocated stock.
  - Deletion: Restricted strictly to `DRAFT` documents.
  - Real-Time Events: Emits `operation.changed` and `stock.changed` on `eventBus` strictly after transaction commit.

- **Inventory Adjustments Module:**
  - `POST /api/adjustments`: Automatically calculates theoretical system balance vs. counted quantity per line.
  - Zero-difference lines are omitted; if all lines match, returns `ValidationError('No difference to adjust')`.
  - Automatic double-entry movements: Positive delta moves virtual `ADJUSTMENT` $\rightarrow$ internal location; negative delta moves internal location $\rightarrow$ virtual `ADJUSTMENT`.
  - Real-time stock lookup endpoint `GET /api/adjustments/on-hand?locationId=...&productId=...` to display current system balance.

- **Frontend Operational UI Suite:**
  - `OperationListPage`: Unified view for Receipts, Deliveries, and Transfers supporting both tabular List view and visual Kanban board grouped by status.
  - URL Query Sync: All filters (`search`, `status`, `warehouseId`, `late`, `view`, `page`) are bidirectional synced to URL search parameters for deep-linking.
  - `OperationForm`: Universal form equipped with status-driven action buttons (To Do, Check Availability, Validate, Print, Cancel), `StatusPipeline` stepper, and large mono reference heading.
  - `LinesEditor`: Dynamic line items table with product search combobox, UoM badges, and red warning alerts with per-line shortage indicators.
  - `PrintSlipPage`: Clean, professional A4-optimized printable slip at `/operations/:id/print` with company header, partner info, line items, and authorized signature blocks. Restricts printing to `DONE` operations.
  - Live SSE telemetry: All list and form views automatically reload when receiving `operation.changed` events without manual page refresh.

---

### 2. Verification Results

| Test Case | Scenario / Execution | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Goods Receipt Flow** | Create receipt `WH/IN/0001` for 100 kg Steel $\rightarrow$ Confirm $\rightarrow$ Validate | Stock moves from VENDOR $\rightarrow$ WH/Stock (+100); status DONE | On-hand becomes 100 kg; ledger written | **PASS** |
| **2. Internal Transfer** | Move 100 kg Steel from `WH/Stock` $\rightarrow$ `WH/Production Floor` | Total warehouse inventory unchanged; locations updated | Stock quant updated at source & dest | **PASS** |
| **3. Delivery Order** | Deliver 20 kg from Production Floor $\rightarrow$ Confirm $\rightarrow$ Validate | Stock moves from Production Floor $\rightarrow$ CUSTOMER (-20) | On-hand decrements to 80 kg; status DONE | **PASS** |
| **4. Cycle Count Adjustment** | Physical count at Production Floor: counted 77 (theoretical 80) | Negative delta (-3) moves stock to ADJUSTMENT; on-hand becomes 77 | On-hand becomes 77 kg; total diff -3 | **PASS** |
| **5. Availability & Shortage** | Delivery for 150 kg (when 77 available) $\rightarrow$ Confirm | Operation moves to WAITING; lines display red shortage badge | Status WAITING; shortBy: 73 kg flagged | **PASS** |
| **6. Double-Validation Race** | Attempting to validate the same operation twice concurrently | First attempt succeeds; second attempt returns 409 INVALID_STATE | 409 InvalidStateError; stock not double-counted | **PASS** |
| **7. Security & Non-Negativity** | Staff attempting to cancel; operations going negative | Staff cannot cancel (403); stock decrement blocked | RBAC blocks staff; stock integrity preserved | **PASS** |
| **8. UI Build & Responsive Design** | Vite production build; dark mode; mobile 375px & desktop 1440px | Build succeeds without warnings; 36px/40px touch rules active | Vite build 534ms; 0 lint errors | **PASS** |

---

### 3. Explicit Notes for Member 3 (Catalog, Stock, Dashboard & Smart Features)

Welcome, Member 3! The operational backbone is live and ready for your Catalog, Stock Ledger, Replenishment, and Dashboard views.

#### A. Adjustments & Operations API Usage
- **Stock Adjustment Trigger (from your Stock Page):**
  - When a user clicks "Adjust Stock" on your `/stock` view, submit:
    ```http
    POST /api/adjustments
    Content-Type: application/json

    {
      "locationId": "uuid-of-internal-location",
      "reason": "COUNT_CORRECTION",
      "notes": "Quick adjustment from stock page",
      "lines": [
        { "productId": "uuid-of-product", "countedQuantity": 42.5 }
      ]
    }
    ```
  - It returns the created `Operation` with status `DONE` and updates `StockQuant` and `StockMove` automatically.
- **Replenishment Purchase Order Generation:**
  - When your auto-replenishment service determines that reorder minimums are reached, trigger a new draft receipt:
    ```http
    POST /api/operations
    Content-Type: application/json

    {
      "type": "RECEIPT",
      "warehouseId": "uuid-of-warehouse",
      "contactId": "uuid-of-preferred-vendor",
      "lines": [
        { "productId": "uuid", "quantity": 100 }
      ]
    }
    ```

#### B. Stable Stock Service Signatures (`services/stock.service.js`)
You can freely import and call these methods in your routes and services:
- `getOnHand(productId, { locationId?, warehouseId? }, tx?)`: Real-time physical quantity across internal locations.
- `getReserved(productId, locationId, tx?, opts?)`: Total stock reserved by pending `READY` delivery/transfers.
- `getFreeToUse(productId, locationId, tx?, opts?)`: $\max(0, \text{OnHand} - \text{Reserved})$.
- `applyMoves(tx, { moves, reference, type, operationId?, userId? })`: Low-level atomic ledger movement execution.

#### C. Real-Time Event Subscriptions
Your dashboard, notifications, and stock views can subscribe to these events using `useSSE`:
- `stock.changed`: `{ productIds: string[], locationIds: string[] }` $\rightarrow$ Re-fetch stock balances or summary counters.
- `operation.changed`: `{ id: string, type: string, status: string }` $\rightarrow$ Update operational KPI badges and activity charts.

#### D. Deep-Linking URL Parameters
Your dashboard KPI cards can link directly into the operational list pages with pre-filtered states:
- `/operations/receipts?status=READY` (Ready to receive)
- `/operations/deliveries?status=WAITING` (Orders waiting for stock)
- `/operations/deliveries?late=true` (Overdue shipments)
- `/operations/transfers?warehouseId=<id>&view=kanban`

---

## Member 3 — Products, Stock, Dashboard & Intelligence
*(To be completed by Member 3)*
