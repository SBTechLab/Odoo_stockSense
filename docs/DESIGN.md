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
Soft pill style with dot indicator and subtle 1px ring overlay (never loud solid blocks):
| Status | Semantic Intent | Light Theme Token | Dark Theme Token |
| :--- | :--- | :--- | :--- |
| **DRAFT** | In preparation / not committed | `bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300/50` | `bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700/50` |
| **WAITING** | Waiting for stock availability | `bg-amber-50 text-amber-700 ring-1 ring-amber-600/20` | `bg-amber-950/60 text-amber-300 ring-1 ring-amber-500/20` |
| **READY** | Stock reserved / ready to execute | `bg-sky-50 text-sky-700 ring-1 ring-sky-600/20` | `bg-sky-950/60 text-sky-300 ring-1 ring-sky-500/20` |
| **DONE** | Transaction posted / stock updated | `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20` | `bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-500/20` |
| **CANCELED** | Terminated / voided | `bg-rose-50 text-rose-700 ring-1 ring-rose-600/20` | `bg-rose-950/60 text-rose-300 ring-1 ring-rose-500/20` |

### 2.3 Move Direction Colors
- **IN (Receipts):** Emerald text & badge (`bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20`)
- **OUT (Deliveries):** Rose text & badge (`bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 ring-1 ring-rose-600/20`)
- **INT (Transfers):** Violet text & badge (`bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 ring-1 ring-violet-600/20`)
- **ADJ (Adjustments):** Amber text & badge (`bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 ring-1 ring-amber-600/20`)

### 2.4 Control Heights & Touch Friendliness Rule
- **Desktop (md breakpoint and up):** Standard control height is **36px** (`md:min-h-[36px] md:h-9`) for inputs, selects, search, buttons, and form controls to maintain high information density. Small buttons (`size="sm"`) are 32px (`h-8`).
- **Mobile (below md breakpoint):** All interactive controls (buttons, inputs, select triggers, navigation links) must be **at least 40px tall** (`min-h-[40px]`) with minimum 40px $\times$ 40px tap targets to ensure comfortable touch operation without misclicks.

### 2.5 Typography & Scale
- **UI Font:** `Inter Variable`, sans-serif (clean, high legibility at 12–14px).
- **Data / Monospace Font:** `JetBrains Mono`, monospace with `tabular-nums` (used for all Document References like `WH/IN/0001`, SKUs, and numerical counts/quantities).
- **Type Scale:**
  - `text-[10px]` / `text-[11px]`: 10–11px (section labels, micro-badges)
  - `text-xs`: 12px / line-height 16px (badges, captions, metadata)
  - `text-sm`: 14px / line-height 20px (body copy, table cells, form labels, controls)
  - `text-base`: 16px / line-height 24px (section headers, modal titles)
  - `text-lg`: 18px / line-height 28px (card titles)
  - `text-2xl`: 24px / line-height 32px (page headers)
  - `text-3xl`: 28–30px semibold (StatCard KPIs, dashboard metrics)

### 2.6 Geometry, Radii & Shadows
- **Spacing:** Base 4px grid (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px).
- **Control Radius:** `rounded-lg` (8px) for buttons, inputs, selects, badges.
- **Card Radius:** `rounded-xl` (12px) for cards, tables, modal containers.
- **Elevation / Shadows:** Clean flat aesthetic with subtle boundary borders (`border border-zinc-200 dark:border-zinc-800`) and soft shadows (`shadow-2xs` or `shadow-xs`). Shadows (`shadow-lg`) reserved for modals, drawers, and dropdown menus.

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

---

## 7. Component Showcase (`/dev/ui`)

A dedicated live showcase route is available at `/dev/ui` to verify all components, interactive states, and tokens in both light and dark mode.
- **Buttons:** Primary, secondary, ghost, danger, loading states, and icon configurations.
- **Status & Direction Pills:** All document status variants with dot indicators and rings.
- **Inputs & Combobox:** 36px/40px inputs, search with `/` shortcut, keyboard-navigable combobox.
- **StatCards:** KPI summaries with tabular numbers and hover elevation.
- **Data Table:** Dense 44px rows with tabular data, sortable headers, and embedded empty states.
- **Overlays:** Modal, Drawer, ConfirmDialog, DropdownMenu, and Tooltips with Esc key handling.
- **Steppers & Toggles:** StatusPipeline, ViewToggle, Tabs, and FilterChips.
