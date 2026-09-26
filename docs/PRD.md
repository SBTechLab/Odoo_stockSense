# StockSense — Product Requirements Document (PRD)

> **Document Version:** 1.0.0  
> **Status:** Approved / Foundation Complete  
> **Target Audience:** All Team Members (Member 1, Member 2, Member 3) and Hackathon Evaluators

---

## 1. Problem Statement & Vision

Many growing manufacturing facilities, wholesale distributors, and retail businesses still manage inventory using manual paper logbooks, whiteboard trackers, or error-prone spreadsheet registers (e.g., Excel/Google Sheets). This introduces critical bottlenecks:
1. **Stock Invisibility & Discrepancies:** On-hand quantities diverge quickly from reality due to unrecorded transfers, mislaid stock, or unaccounted scrap.
2. **Double Allocations & Stockouts:** Multiple sales or delivery orders claim the same physical inventory, leading to missed shipments or customer dissatisfaction.
3. **Audit Trail Deficits:** Lack of an immutable stock ledger prevents tracking who moved which item, from where, to where, and when.
4. **Disjointed Workflows:** Receiving, internal putaway/transfer, picking/delivery, and stock counting operate in silos without automated state transitions.

**StockSense** replaces manual registers and disjointed spreadsheets with a unified, real-time, responsive web application. Inspired by battle-tested ERP workflows (such as Odoo Inventory), StockSense introduces double-entry stock movement tracking, automated document sequencing, role-guarded permissions, and live notifications.

---

## 2. Target Users & Personas

| Persona | Primary Needs & Responsibilities | Key Capabilities in StockSense |
| :--- | :--- | :--- |
| **Inventory Manager** | Oversees overall stock health, warehouse capacity, vendor receipts, and customer fulfillment. | Full visibility across all warehouses and locations; create, confirm, and validate Receipts and Delivery Orders; manage reorder rules and supplier contacts; generate valuation reports. |
| **Warehouse Staff** | Works on the floor executing physical putaway, shelf transfers, picking, packing, and periodic inventory counts. | Fast barcode/SKU scanning; execute internal transfers between racks/floors; count physical stock and submit adjustments; print delivery and receipt slips; view pending queues. |
| **System Admin** | Manages system access, infrastructure integrity, and master configuration. | User lifecycle management (role assignments, deactivation); warehouse & location definition; system audit and activity inspection. |

---

## 3. Scope & Priorities (P0 / P1 / P2)

### P0 — Must Demo (Hackathon Core)
- **Authentication & Security:** Secure signup, login (login ID or email), 6-digit OTP password reset (with console fallback for offline use), httpOnly JWT sessions, role-based access control (ADMIN, MANAGER, STAFF).
- **Core Operations Lifecycle:**
  - Receipts (Vendor $\rightarrow$ Internal): Draft $\rightarrow$ Ready $\rightarrow$ Done.
  - Delivery Orders (Internal $\rightarrow$ Customer): Draft $\rightarrow$ Waiting (short stock) $\rightarrow$ Ready (stock reserved) $\rightarrow$ Done.
  - Internal Transfers (Internal $\rightarrow$ Internal): Relocate stock across racks/zones.
  - Inventory Adjustments: Physical count comparison against theoretical on-hand, generating balancing ledger moves.
- **Double-Entry Immutable Stock Ledger (`StockMove`):** Every quantity movement recorded with reference, timestamp, operator, source, destination, unit cost, and line linkage.
- **Stock Quants & Reservations:** On-hand tracked per product per internal location. Free-to-use calculated dynamically as `On Hand - Reserved`. Conditional atomic decrements prevent negative stock.
- **Master Data Management:** Multi-warehouse support with short codes (`WH`, `WH2`); multi-location hierarchy (`WH/Stock`, `WH/Rack-A`); product catalog with SKUs and unit costs.
- **Printable Slips:** Clean, zero-nav print layouts for validated Receipts and Delivery Orders.
- **Real-Time Updates:** Server-Sent Events (SSE) streaming stock updates and operation status changes.
- **Activity & Audit Trail:** Structured logging of all administrative and transactional actions.
- **Dark/Light Mode & Offline-First:** Fully self-contained local deployment with bundled fonts and zero external CDN dependencies.

### P1 — Strong Extras (Competitive Edge)
- **Replenishment Engine:** Automatic evaluation of reorder rules (`minQty`, `maxQty`) generating draft purchase receipts.
- **Global Command Palette (Ctrl+K):** Instant search over SKUs, products, operation references, and contacts.
- **Notification Center:** Real-time alerts for low stock, out-of-stock items, and late operations.
- **CSV Import & Export:** Bulk import for products and one-click export for stock valuation and move history.
- **Stock Valuation:** Real-time inventory valuation (`onHand * costPrice`) by warehouse and category.
- **Barcode Support:** Compatible with standard keyboard-wedge USB/Bluetooth barcode scanners.

### P2 — If Time Permits
- Multi-currency conversion for cross-border logistics.
- Batch and serial number tracking with expiration dates.
- Multi-level location route automation (e.g., 2-step receive: Input $\rightarrow$ Quality Control $\rightarrow$ Stock).

---

## 4. End-to-End Inventory Flow Example

To illustrate how StockSense mirrors real-world physical material movements:

1. **Receipt (PO Fulfillment):**
   - **Scenario:** Receive 100 kg of *Structural Steel Rods* from vendor *Tata Steel Ltd*.
   - **Document:** `WH/IN/0001` (Type: `RECEIPT`, Source: `Vendors`, Dest: `WH/Stock`).
   - **Action:** Transition from Draft $\rightarrow$ Ready $\rightarrow$ Validate.
   - **Result:** `StockQuant` at `WH/Stock` increases by +100.000 kg. `StockMove` recorded: `Vendors -> WH/Stock (100 kg, ₹65.00/kg)`.
2. **Internal Transfer (Putaway / Relocation):**
   - **Scenario:** Transfer 40 kg from general `WH/Stock` to `WH/Production Floor` for active assembly.
   - **Document:** `WH/INT/0001` (Type: `INTERNAL`, Source: `WH/Stock`, Dest: `WH/Production Floor`).
   - **Action:** Validate transfer.
   - **Result:** `WH/Stock` decrements to 60 kg; `WH/Production Floor` increments to 40 kg. Total warehouse on-hand remains 100 kg.
3. **Delivery Order (Sales Fulfillment):**
   - **Scenario:** Deliver 20 kg to client *Metro Builders*.
   - **Document:** `WH/OUT/0001` (Type: `DELIVERY`, Source: `WH/Stock`, Dest: `Customers`).
   - **Check Availability:** System checks `WH/Stock` on-hand (60 kg) $\ge$ demand (20 kg). Status advances from Draft to Ready (reserving 20 kg, Free to Use drops to 40 kg).
   - **Action:** Validate delivery upon truck dispatch.
   - **Result:** `WH/Stock` on-hand decrements to 40 kg. `StockMove` recorded: `WH/Stock -> Customers (20 kg)`.
4. **Inventory Adjustment (Cycle Count Discrepancy):**
   - **Scenario:** Physical audit at `WH/Stock` finds only 37 kg instead of recorded 40 kg (3 kg damaged/corroded).
   - **Document:** `WH/ADJ/0001` (Type: `ADJUSTMENT`, Location: `WH/Stock`, Counted: 37 kg, Difference: -3 kg).
   - **Action:** Apply Adjustment.
   - **Result:** `WH/Stock` updated to 37 kg. `StockMove` recorded: `WH/Stock -> Inventory Adjustment (3 kg)`. Complete audit log preserved.

---

## 5. Module Requirements & Acceptance Criteria

### 5.1 Authentication & Profile
- **AC 1.1 (Signup Rules):** Login ID must be 6–12 alphanumeric characters. Email must be valid and unique. Password must exceed 8 characters and contain at least one uppercase letter, one lowercase letter, and one special character (`!@#$%^&*()_+...`). Re-entered password must match. New signups automatically receive `STAFF` role.
- **AC 1.2 (Login):** Accepts either `loginId` or `email` plus `password`. If invalid, returns generic: `"Invalid Login Id or Password"`. Successful login sets an httpOnly session cookie with 8-hour expiry.
- **AC 1.3 (OTP Password Reset):** 3-step sequence:
  1. Submit email $\rightarrow$ generates 6-digit OTP (10 min expiry, 5 attempt limit), prints to console (or sends via SMTP). Always responds generically to prevent account enumeration.
  2. Verify OTP $\rightarrow$ returns temporary reset token.
  3. Submit new password $\rightarrow$ validates against password policy and updates hash.
- **AC 1.4 (Profile):** Authenticated users can view their login ID, role, and last login timestamp; update their display name and email; and change password by confirming their current password.

### 5.2 Settings (Warehouses, Locations, Users, Activity)
- **AC 2.1 (Warehouses):** Admin/Manager can create/edit warehouses (`name`, uppercase `shortCode`, `address`, `defaultLocationId`). Short codes must be unique. Deletion is soft (`isActive: false`) and strictly blocked if the warehouse or its locations hold physical stock or have active (Draft/Waiting/Ready) operations.
- **AC 2.2 (Locations):** Locations belong to a warehouse (except global virtual locations `Vendors`, `Customers`, `Inventory Adjustment`). Location short code is unique per warehouse. Full display name formatted as `<WarehouseCode>/<LocationCode>` (e.g. `WH/Stock`). Deletion blocked if stock exists.
- **AC 2.3 (User Management - ADMIN Only):** Admin can view all registered users, update roles (`ADMIN`, `MANAGER`, `STAFF`), and toggle active status. Admins cannot demote or deactivate their own active session. Non-admins requesting `/api/users` receive `403 Forbidden`.
- **AC 2.4 (Activity Log):** Comprehensive audit log recording `userId`, `action` (e.g. `warehouse.create`, `user.update_role`), `entityType`, `entityId`, timestamp, and JSON metadata. Filterable by user, entity type, and date range.

### 5.3 Operations (Receipts, Deliveries, Transfers, Adjustments) — Member 2
- **AC 3.1 (Reference Sequencing):** Format `<WH>/<IN|OUT|INT|ADJ>/<0001>`. Auto-incremented atomically per warehouse per operation type using PostgreSQL sequence counter.
- **AC 3.2 (Receipt Workflow):** Draft $\rightarrow$ Ready (via "To Do") $\rightarrow$ Done (via "Validate"). Print button available only once Done. Fields: Receive From (Contact), Scheduled Date, Responsible (default logged-in user), product lines (Product, Quantity).
- **AC 3.3 (Delivery Workflow):** Draft $\rightarrow$ Waiting $\rightarrow$ Ready $\rightarrow$ Done. Check availability highlights insufficient stock lines in red with short-by quantities. Validating decrements stock atomically.
- **AC 3.4 (Move History):** Tabular view of all `StockMove` records. Columns: Reference, Date, Contact, From, To, Quantity, Status. Incoming moves highlighted in subtle green, outgoing in subtle red. Searchable by reference and contact. Includes Kanban toggle.

### 5.4 Products, Stock, Dashboard & Intelligence — Member 3
- **AC 4.1 (Product Catalog):** SKU (unique, uppercase), name, category, UOM, cost price, sale price, optional initial stock with location assignment.
- **AC 4.2 (Stock Page):** Tabular ledger showing Product, SKU, Unit Cost, On Hand, Free to Use, Total Valuation. Direct stock adjustment shortcut.
- **AC 4.3 (Dashboard):** Real-time KPI summary (Total items in stock, low/out-of-stock items, pending receipts, pending deliveries, scheduled transfers).
  - Receipt Card: "N to receive", "X late" (scheduled date < today and not done/canceled), "Y operations" (scheduled date > today).
  - Delivery Card: "N to deliver", "X late", "Y waiting" (waiting for stock), "Z operations".
  - Filterable by warehouse, location, document type, status, and category.
- **AC 4.4 (Replenishment):** Scans active reorder rules (`minQty`, `maxQty`) and prompts 1-click creation of draft receipts.
