# StockSense — Design System & UI Guidelines

> **Document Version:** 1.0.0  
> **Status:** Standard for all components and pages  
> **Engine:** Tailwind CSS v4 via `@tailwindcss/vite`

---

## 1. Design Philosophy

StockSense is an operational enterprise tool engineered for speed, high information density, and absolute clarity.
1. **Data-First & High-Density:** Maximize visual workspace. Display numerical data, operational statuses, and document links cleanly without gratuitous ornamentation.
2. **Dense but Calm:** Maintain a disciplined 4px grid, ample micro-whitespace, subtle 1px borders, and muted background tones to avoid cognitive fatigue during high-volume data entry.
3. **Consistency Across Authors:** Three engineers will construct distinct pages. Every view must share identical headers, filter bars, table wrappers, empty states, and feedback toasts.
4. **Offline & Self-Contained:** Zero external CDN links. All fonts (`Inter`, `JetBrains Mono`) are packaged locally via Fontsource.

---

## 2. Design Tokens

Tokens are defined in `client/src/index.css` leveraging Tailwind CSS v4's native `@theme` directives and CSS custom properties.

### 2.1 Color Palette
- **Brand / Primary (Teal):**
  - Primary Hover: `var(--color-teal-700)` (`#0F766E`)
  - Primary Base: `var(--color-teal-600)` (`#0D9488`)
  - Primary Light: `var(--color-teal-50)` (`#F0FDFA`)
  - Dark Primary: `var(--color-teal-500)` (`#14B8A6`)
- **Accent (Amber):** Warnings, pending actions, attention states.
- **Neutrals (Zinc):**
  - Light mode: Background `zinc-50` (`#FAFAFA`), Surface `white` (`#FFFFFF`), Borders `zinc-200` (`#E4E4E7`), Text `zinc-900` (`#18181B`), Muted `zinc-500` (`#71717A`).
  - Dark mode (`.dark` class): Background `zinc-950` (`#09090B`), Surface `zinc-900` (`#18181B`), Borders `zinc-800` (`#27272A`), Text `zinc-100` (`#F4F4F5`), Muted `zinc-400` (`#A1A1AA`).

### 2.2 Semantic Status Colors
| Status | Semantic Intent | Light Theme Token | Dark Theme Token |
| :--- | :--- | :--- | :--- |
| **DRAFT** | In preparation / not committed | `bg-zinc-100 text-zinc-700 border-zinc-300` | `bg-zinc-800 text-zinc-300 border-zinc-700` |
| **WAITING** | Waiting for stock availability | `bg-amber-50 text-amber-700 border-amber-300` | `bg-amber-950/60 text-amber-300 border-amber-800` |
| **READY** | Stock reserved / ready to execute | `bg-sky-50 text-sky-700 border-sky-300` | `bg-sky-950/60 text-sky-300 border-sky-800` |
| **DONE** | Transaction posted / stock updated | `bg-emerald-50 text-emerald-700 border-emerald-300` | `bg-emerald-950/60 text-emerald-300 border-emerald-800` |
| **CANCELED** | Terminated / voided | `bg-rose-50 text-rose-700 border-rose-300` | `bg-rose-950/60 text-rose-300 border-rose-800` |

### 2.3 Move Direction Colors
- **IN (Receipts):** Emerald text & badge (`bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400`)
- **OUT (Deliveries):** Rose text & badge (`bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400`)
- **INT (Transfers):** Violet text & badge (`bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400`)
- **ADJ (Adjustments):** Amber text & badge (`bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400`)

### 2.4 Typography & Scale
- **UI Font:** `Inter Variable`, sans-serif (clean, high legibility at 12–14px).
- **Data / Monospace Font:** `JetBrains Mono`, monospace (used for all Document References like `WH/IN/0001`, SKUs, and tabular quantities).
- **Type Scale:**
  - `text-xs`: 12px / line-height 16px (badges, captions, metadata)
  - `text-sm`: 14px / line-height 20px (body copy, table cells, form labels, controls)
  - `text-base`: 16px / line-height 24px (section headers, lead paragraphs)
  - `text-lg`: 18px / line-height 28px (card titles, modal titles)
  - `text-xl`: 20px / line-height 28px (sub-page titles)
  - `text-2xl`: 24px / line-height 32px (page headers)
  - `text-3xl`: 30px / line-height 36px (KPI values, dashboard metrics)

### 2.5 Geometry, Radii & Shadows
- **Spacing:** Base 4px grid (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px).
- **Control Radius:** `rounded-lg` (8px) for buttons, inputs, selects, badges.
- **Card Radius:** `rounded-xl` (12px) for cards, tables, modal containers.
- **Elevation / Shadows:** Clean flat aesthetic with subtle boundary borders (`border border-zinc-200 dark:border-zinc-800`) and soft shadows (`shadow-xs` or `shadow-sm`). High shadows (`shadow-xl`) reserved for floating modals and dropdown menus.

---

## 3. Application Layout Structure

The main authenticated shell (`AppLayout`) consists of:
```
+-------------------------------------------------------------------------+
| [=] StockSense      [Search Ctrl+K]               [Bell] [Theme] [User] | Topbar
+-------------------+-----------------------------------------------------+
| Dashboard         |                                                     |
| OPERATIONS        |  Page Header: Title + Breadcrumbs + Actions [NEW]   |
|   Receipts        | --------------------------------------------------- |
|   Deliveries      |  Filter Bar: [Search] [Chips] [List / Kanban]       |
|   Transfers       | --------------------------------------------------- |
|   Adjustments     |                                                     |
| PRODUCTS          |  Main Content View:                                 |
|   Products        |  - Data Table / Kanban Board                        |
|   Categories      |  - Pagination footer                                |
|   Stock           |                                                     |
|   Replenishment   |                                                     |
| Move History      |                                                     |
| Contacts          |                                                     |
| SETTINGS          |                                                     |
|   Warehouses      |                                                     |
|   Locations       |                                                     |
|   Users [admin]   |                                                     |
|   Activity Log    |                                                     |
| ----------------- |                                                     |
| [Avatar] Profile  |                                                     |
+-------------------+-----------------------------------------------------+
```

### 3.1 Left Sidebar
- **Fixed Desktop / Collapsible:** 260px wide, collapsable to 68px icon-only rail or full drawer on mobile.
- **Navigation Order:**
  1. `Dashboard` (`/dashboard`)
  2. Section `OPERATIONS`: `Receipts` (`/operations/receipts`), `Deliveries` (`/operations/deliveries`), `Internal Transfers` (`/operations/transfers`), `Adjustments` (`/operations/adjustments`)
  3. Section `PRODUCTS`: `Products` (`/products`), `Categories` (`/products/categories`), `Stock` (`/stock`), `Replenishment` (`/replenishment`)
  4. `Move History` (`/moves`)
  5. `Contacts` (`/contacts`)
  6. Section `SETTINGS`: `Warehouses` (`/settings/warehouses`), `Locations` (`/settings/locations`), `Users` (`/settings/users` — ADMIN only), `Activity Log` (`/settings/activity`)
- **Bottom Footer:** User profile quick summary, My Profile link, and Logout button.

### 3.2 Topbar
- Mobile menu hamburger toggle.
- Breadcrumb navigation (`Operations / Receipts / WH/IN/0001`).
- Global Search Trigger: `<button>` styled as a pill displaying `"Search anything... (Ctrl+K)"`.
- Live Notification Bell (`<NotificationBell />`) with unread counter badge.
- Dark/Light Theme toggle button with smooth icon transition.
- User Avatar with status dot.

---

## 4. Canonical Page Patterns

### 4.1 Standard List Page Pattern
1. **`<PageHeader />`**: Title, descriptive subtitle, breadcrumbs, primary CTA button (`+ NEW`).
2. **Filter & Search Bar**:
   - `<SearchInput />`: auto-debounced (300ms), keyboard shortcut `/` focuses input.
   - `<FilterChips />`: active pill toggles (e.g. `Status: Ready`, `Warehouse: Main`).
   - `<ViewToggle />`: switch between tabular `List` view and drag-free `Kanban` status board.
3. **Data Grid (`<DataTable />`)**:
   - Header with sortable column triggers (`▲▼`).
   - Sticky table header on scroll.
   - Horizontal scroll containment with visual shadow indicators.
   - Empty, Loading, and Error states embedded directly in the table canvas.
4. **`<Pagination />`**: Current range (`Showing 1-25 of 142`), rows-per-page selector (10, 25, 50, 100), Prev/Next buttons.

### 4.2 Standard Form Page Pattern
1. **Header Action Bar**:
   - Top-left: Primary Action Buttons (e.g. `To Do`, `Validate`, `Print`, `Cancel`).
   - Top-right: `<StatusPipeline />` stepper displaying visual lifecycle (`Draft` $\rightarrow$ `Ready` $\rightarrow$ `Done`).
2. **Form Body (Two Columns on desktop, single on mobile)**:
   - Primary operational fields (Partner/Vendor, Warehouse, Scheduled Date, Responsible).
3. **Product Lines Table**:
   - Embedded sub-table with inline editable or modal rows (`Product`, `Demand Qty`, `Unit Price`, `Stock Status`).
   - Highlight short-of-stock rows in soft red.
   - `+ Add Line` footer trigger.

---

## 5. Mandatory UI View States

Every dynamic view in StockSense **must** support four explicit states:
1. **Loading State:** Render structured skeletons (`<Skeleton />`) that match the exact shape of incoming content (e.g. 5 table rows with avatar and badge skeletons). Never show a blank screen.
2. **Empty State (`<EmptyState />`):** Render a friendly Lucide icon, explanatory headline (e.g. `"No delivery orders found"`), helpful hint, and an actionable primary CTA (e.g. `"Create Delivery"`).
3. **Error State (`<ErrorState />`):** Render an alert icon, clear human-readable error description, and a `"Retry"` button calling `refetch()`.
4. **Success State:** Use `sonner` toasts for asynchronous feedback (`toast.success('Warehouse created successfully')`).

---

## 6. Accessibility & Responsiveness

- **Keyboard First:**
  - `Ctrl+K`: Opens Command Palette.
  - `/`: Focuses the list search box.
  - `Esc`: Closes dialogs, drawers, and modal popups.
- **Focus Rings:** Visible, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none`).
- **Color Contrast:** All text tokens meet WCAG 2.1 AA minimum 4.5:1 contrast against their surfaces.
- **Responsive Viewports:**
  - `< 640px (Mobile)`: Sidebar becomes an overlay drawer; data tables scroll horizontally; form columns stack vertically; minimum touch targets 40px $\times$ 40px.
  - `768px - 1024px (Tablet)`: Sidebar collapses to compact rail; secondary table columns hide conditionally.
  - `> 1024px (Desktop)`: Full expanded layout.
