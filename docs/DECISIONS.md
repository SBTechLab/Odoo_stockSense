# StockSense — Architectural Decision Records (ADRs)

> **Document Version:** 1.0.0  
> **Status:** Accepted Standards for All Contributors

---

### ADR-001: Technology Stack Selection
- **Context:** An 8-hour hackathon requires high developer velocity, zero configuration friction, robust data integrity, and strict separation between members.
- **Decision:**
  - Frontend: React 19 + Vite + JavaScript (no TypeScript compilation overhead) + React Router v7 + Tailwind CSS v4 via `@tailwindcss/vite` + Lucide icons + Recharts + Sonner toasts.
  - Backend: Node.js (ESM `"type": "module"`) + Express 5 + Zod + Prisma ORM + PostgreSQL.
- **Consequences:** Immediate runtime execution without build transpilation lags; rich component styling via utility classes; strongly typed schemas through Zod without TypeScript ceremony.

---

### ADR-002: Session Authentication via httpOnly Cookie vs. LocalStorage
- **Context:** Need secure, hassle-free session persistence across browser refreshes without exposing JWT credentials to XSS attacks.
- **Decision:** Issue JWT inside an `httpOnly`, `sameSite: "lax"` cookie named `token`. The Vite proxy forwards `/api` requests to port 5000 so requests are same-origin.
- **Consequences:** Eliminates token theft via malicious JavaScript. The frontend does not need to attach `Bearer` authorization headers manually; Axios sends cookies automatically with `withCredentials: true`.

---

### ADR-003: 8-Hour Session Expiry Without Refresh Token Flow
- **Context:** Refresh token rotation and Redis token blacklisting introduce unnecessary architectural surface area for an 8-hour hackathon timeline.
- **Decision:** JWTs have an 8-hour lifetime (`JWT_EXPIRES_IN=8h`). When a user logs out, the cookie is expired immediately. Inactive or demoted users are caught instantly on every request because `requireAuth` loads the fresh user record from the database.
- **Consequences:** Greatly simplified authentication logic while maintaining real-time revocation capabilities.

---

### ADR-004: Server-Sent Events (SSE) vs. WebSockets
- **Context:** Clients require real-time notifications for stock level changes, operation transitions, and low-stock alerts. Full-duplex communication is not required because mutations are handled over standard REST POST/PATCH calls.
- **Decision:** Use native Server-Sent Events (`GET /api/events`) over HTTP/1.1 instead of WebSockets (`ws`/`socket.io`).
- **Consequences:** Native browser `EventSource` API handles auto-reconnection out of the box with zero external client libraries. Works seamlessly through proxies and corporate firewalls.

---

### ADR-005: Dual Stock Model — StockQuant (On-Hand) + StockMove (Ledger)
- **Context:** Calculating real-time stock balances across hundreds of products by aggregating historic transactions becomes slow. Conversely, updating a single counter without movement history destroys the audit trail.
- **Decision:**
  - `StockQuant`: Fast snapshot of on-hand quantity per product per `INTERNAL` location.
  - `StockMove`: Immutable double-entry ledger recording every single physical transfer from location A to location B with timestamp, user ID, and unit cost.
- **Consequences:** Blazing fast reads for warehouse stock views combined with enterprise-grade auditability.

---

### ADR-006: Virtual Locations (Vendors, Customers, Inventory Adjustment)
- **Context:** Receipts come from external suppliers; deliveries depart to external customers; inventory adjustments account for physical loss or gain.
- **Decision:** Treat external counter-parties as virtual locations with `warehouseId: null`. Virtual locations never have `StockQuant` balances.
- **Consequences:** Uniform double-entry bookkeeping: every transaction is always a movement between two locations (`fromLocationId -> toLocationId`).

---

### ADR-007: Availability Calculation: Free to Use = On Hand - READY Reservations
- **Context:** Multiple delivery orders or internal transfers may request the same inventory before shipments leave the warehouse dock.
- **Decision:** When an operation moves to `READY` status, its demanded product quantities are considered reserved. Free to Use is dynamically calculated as:
  $$\text{Free to Use} = \max(0, \text{On Hand} - \text{Reserved})$$
- **Consequences:** Completely prevents double allocation of physical stock.

---

### ADR-008: Atomic Conditional Decrement to Guarantee Stock Non-Negativity
- **Context:** Concurrent requests could attempt to deduct stock simultaneously, potentially pushing physical inventory below zero.
- **Decision:** Deductions on `StockQuant` execute a conditional SQL update: `WHERE quantity >= $demand`. If 0 rows are affected, an `InsufficientStockError` is thrown, rolling back the transaction.
- **Consequences:** Database-enforced stock integrity with zero race conditions.

---

### ADR-009: Per-Warehouse, Per-Operation Reference Auto-Sequencing
- **Context:** Warehouse documents require clear, human-readable identifier strings (e.g. `WH/IN/0001`, `WH2/OUT/0014`).
- **Decision:** Atomic upsert counter in `SequenceCounter` table keyed by `(warehouseId, type)`. Sequence numbers pad to 4 digits.
- **Consequences:** Eliminates concurrency collisions when multiple warehouse staff generate receipts simultaneously.

---

### ADR-010: No Backorders or Partial Validation in v1
- **Context:** Handling partial deliveries and splitting backorders into child documents adds significant complexity to UI and state handling.
- **Decision:** In v1, operations are validated in whole. If partial quantity is received or shipped, users adjust the line quantity before clicking Validate.
- **Consequences:** Keeps the operation state machine clean and predictable for Members 2 and 3.

---

### ADR-011: OTP Password Reset Mechanism & Console Fallback
- **Context:** Users need self-service password recovery, but hackathon evaluation environments might not have internet access or valid SMTP credentials.
- **Decision:** 6-digit cryptographic OTP hashed with bcrypt (10-minute expiry, max 5 attempts). If SMTP credentials are configured, sends an email; otherwise, outputs the OTP directly to the server terminal with clear visual demarcation.
- **Consequences:** Fully functional offline testing without email blockers, with identical production-grade security semantics.

---

### ADR-012: Soft Deletes for Master Data
- **Context:** Deleting a warehouse, location, or product that is already referenced by historical stock ledger rows would violate relational foreign key constraints or destroy audit records.
- **Decision:** Master entities use an `isActive: boolean` flag for soft deletion. Deletion is blocked if physical stock remains or pending operations are active.
- **Consequences:** Full historical integrity is preserved; inactive records are hidden from standard operational selectors.

---

### ADR-013: Decimal Datatypes for Quantities and Financial Values
- **Context:** Floating-point arithmetic produces precision errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
- **Decision:** In PostgreSQL and Prisma, quantities use `Decimal(14,3)` (allowing fractional weights/lengths up to 3 decimal places) and currency uses `Decimal(12,2)`.
- **Consequences:** Exact financial and metric precision across all ledgers.

---

### ADR-014: Self-Hosted Typography & Zero CDN Dependencies
- **Context:** Hackathon venue Wi-Fi may be intermittent, slow, or restricted.
- **Decision:** Fonts (`@fontsource-variable/inter` and `@fontsource/jetbrains-mono`) and icons (`lucide-react`) are bundled as local NPM dependencies.
- **Consequences:** StockSense functions 100% offline in air-gapped environments.

---

### ADR-015: Sequential Development Workflow with Folder Ownership
- **Context:** A 3-person team pushing to the same repo can suffer merge conflicts and duplicated effort.
- **Decision:** Strictly sequential workflow:
  - Member 1: Foundation, Auth, Settings, Database, Docs, Core Services, UI Kit.
  - Member 2: Operations, Contacts, Move History, Slips.
  - Member 3: Products, Stock, Dashboard, Replenishment, Smart Filters.
- **Consequences:** Zero merge conflicts. Each member commits directly to `main` with Conventional Commit messages.

---

### ADR-016: Collapsible Left Sidebar Navigation
- **Context:** Problem statement mockup requires rapid access across operations, master data, and user profile.
- **Decision:** Persistent left sidebar with collapsible desktop rail, responsive mobile drawer, and bottom profile menu.
- **Consequences:** Natural enterprise UX matching industry benchmarks.
