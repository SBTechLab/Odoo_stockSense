# StockSense — REST API Contract & Specifications

> **Document Version:** 1.0.0  
> **Status:** Complete Master API Specification (Implemented & Stubs)  
> **Base URL:** `/api`  
> **Content-Type:** `application/json`

---

## 1. Global Standards & Conventions

### 1.1 Standard Response Envelope
All responses return a JSON envelope:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 104,
    "totalPages": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | UNAUTHORIZED | FORBIDDEN | INSUFFICIENT_STOCK",
    "message": "Human readable explanation",
    "details": [
      { "path": "shortCode", "message": "This short code is already in use" }
    ]
  }
}
```

### 1.2 Authentication & Headers
- Authenticated requests rely on an `httpOnly` cookie named `token` containing an 8-hour JWT.
- Vite frontend proxies `/api` to `http://localhost:5000` with `withCredentials: true`, eliminating CORS issues in the browser.

---

## 2. Foundation Endpoints (Member 1 — Fully Implemented)

### 2.1 System Health
- **`GET /api/health`**
  - **Auth:** Public
  - **Response 200:** `{ "success": true, "data": { "status": "ok", "db": "ok", "uptime": 120, "time": "..." } }`

### 2.2 Authentication Module (`/api/auth`)
- **`POST /api/auth/register`**
  - **Auth:** Public (Rate limited)
  - **Body:** `{ "name": "string", "loginId": "string (6-12)", "email": "email", "password": "valid password" }`
  - **Response 201:** Sets cookie `token`, returns `{ "success": true, "data": { "user": User } }`
- **`POST /api/auth/login`**
  - **Auth:** Public (Rate limited)
  - **Body:** `{ "loginId": "string", "password": "string" }` (Accepts loginId OR email)
  - **Response 200:** Sets cookie `token`, returns `{ "success": true, "data": { "user": User } }`
  - **Error 401:** `{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Invalid Login Id or Password" } }`
- **`POST /api/auth/logout`**
  - **Auth:** Authenticated
  - **Response 200:** Clears cookie `token`, returns `{ "success": true, "data": { "message": "Logged out" } }`
- **`GET /api/auth/me`**
  - **Auth:** Authenticated
  - **Response 200:** `{ "success": true, "data": { "user": User } }`
- **`PATCH /api/auth/me`**
  - **Auth:** Authenticated
  - **Body:** `{ "name"?: "string", "email"?: "email" }`
  - **Response 200:** `{ "success": true, "data": { "user": User } }`
- **`PATCH /api/auth/me/password`**
  - **Auth:** Authenticated
  - **Body:** `{ "currentPassword": "string", "newPassword": "valid password" }`
  - **Response 200:** `{ "success": true, "data": { "message": "Password updated successfully" } }`
- **`POST /api/auth/forgot-password`**
  - **Auth:** Public (Rate limited)
  - **Body:** `{ "email": "email" }`
  - **Response 200:** `{ "success": true, "data": { "message": "If that email exists, an OTP has been sent." } }` (Prints 6-digit OTP to server console if SMTP is empty)
- **`POST /api/auth/verify-otp`**
  - **Auth:** Public (Rate limited)
  - **Body:** `{ "email": "email", "otp": "string (6 digits)" }`
  - **Response 200:** `{ "success": true, "data": { "resetToken": "string" } }`
- **`POST /api/auth/reset-password`**
  - **Auth:** Public (Rate limited)
  - **Body:** `{ "resetToken": "string", "newPassword": "valid password" }`
  - **Response 200:** `{ "success": true, "data": { "message": "Password reset successfully. Please log in." } }`

### 2.3 Users Management (`/api/users`)
- **`GET /api/users`**
  - **Auth:** ADMIN only
  - **Query:** `?search&role&isActive&page&limit`
  - **Response 200:** `{ "success": true, "data": [User], "meta": Pagination }`
- **`PATCH /api/users/:id`**
  - **Auth:** ADMIN only
  - **Body:** `{ "role"?: "ADMIN|MANAGER|STAFF", "isActive"?: boolean }`
  - **Response 200:** `{ "success": true, "data": User }`
  - **Error 409:** When attempting to demote or deactivate yourself.

### 2.4 Warehouses (`/api/warehouses`)
- **`GET /api/warehouses`**
  - **Auth:** Any authenticated user
  - **Query:** `?search&includeInactive=true|false`
  - **Response 200:** `{ "success": true, "data": [Warehouse with locationCount] }`
- **`GET /api/warehouses/:id`**
  - **Auth:** Any authenticated user
  - **Response 200:** `{ "success": true, "data": Warehouse with locations }`
- **`POST /api/warehouses`**
  - **Auth:** ADMIN, MANAGER
  - **Body:** `{ "name": "Main", "shortCode": "WH", "address"?: "..." }`
  - **Response 201:** Automatically creates default location `Stock` (`STOCK`), returns `{ "success": true, "data": Warehouse }`
- **`PATCH /api/warehouses/:id`**
  - **Auth:** ADMIN, MANAGER
  - **Body:** `{ "name"?: "...", "shortCode"?: "...", "address"?: "...", "defaultLocationId"?: "uuid" }`
  - **Response 200:** `{ "success": true, "data": Warehouse }`
- **`DELETE /api/warehouses/:id`**
  - **Auth:** ADMIN, MANAGER
  - **Response 200:** `{ "success": true, "data": { "message": "Warehouse deleted" } }`
  - **Error 409:** If warehouse locations hold stock or open operations exist.

### 2.5 Locations (`/api/locations`)
- **`GET /api/locations`**
  - **Auth:** Any authenticated user
  - **Query:** `?warehouseId&type=INTERNAL|VENDOR|CUSTOMER|ADJUSTMENT&search&includeInactive`
  - **Response 200:** `{ "success": true, "data": [Location with fullName "WH/Stock"] }`
- **`GET /api/locations/:id`**
  - **Auth:** Any authenticated user
  - **Response 200:** `{ "success": true, "data": Location }`
- **`POST /api/locations`**
  - **Auth:** ADMIN, MANAGER
  - **Body:** `{ "name": "Rack A", "shortCode": "RACK-A", "type": "INTERNAL", "warehouseId": "uuid" }`
  - **Response 201:** `{ "success": true, "data": Location }`
- **`PATCH /api/locations/:id`**
  - **Auth:** ADMIN, MANAGER
  - **Body:** `{ "name"?: "...", "shortCode"?: "...", "type"?: "...", "isActive"?: boolean }`
  - **Response 200:** `{ "success": true, "data": Location }`
- **`DELETE /api/locations/:id`**
  - **Auth:** ADMIN, MANAGER
  - **Response 200:** `{ "success": true, "data": { "message": "Location deleted" } }`
  - **Error 409:** If location holds physical stock, has pending operations, or is a virtual location.

### 2.6 Activity Audit Log (`/api/activity`)
- **`GET /api/activity`**
  - **Auth:** Any authenticated user
  - **Query:** `?userId&entityType&dateFrom&dateTo&page&limit`
  - **Response 200:** `{ "success": true, "data": [ActivityLog], "meta": Pagination }`

### 2.7 Live Events Stream (`/api/events`)
- **`GET /api/events`**
  - **Auth:** Any authenticated user (via session cookie)
  - **Protocol:** Server-Sent Events (`text/event-stream`)
  - **Events Emitted:**
    - `stock.changed`: `{ productIds: string[], locationIds: string[] }`
    - `operation.changed`: `{ id: string, type: string, status: string }`
    - `notification.created`: `{ id: string, title: string, message: string }`
    - `: heartbeat`: Sent every 25 seconds.

---

## 3. Operations Endpoints (Member 2 — Stubs Present, 501 until implemented)

### 3.1 Contacts (`/api/contacts`)
- `GET /api/contacts?type=VENDOR|CUSTOMER|BOTH&search&page&limit`
- `POST /api/contacts`
- `GET /api/contacts/:id`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`

### 3.2 Operations (`/api/operations`)
- `GET /api/operations?type&status&warehouseId&locationId&contactId&search&late&dateFrom&dateTo&page&limit&sort`
- `GET /api/operations/board?type` (Status-grouped Kanban board payload)
- `POST /api/operations` (Create Draft operation with lines)
- `GET /api/operations/:id`
- `PATCH /api/operations/:id` (Allowed in DRAFT only)
- `DELETE /api/operations/:id` (Allowed in DRAFT only)
- `POST /api/operations/:id/confirm` (Transitions DRAFT $\rightarrow$ READY or WAITING)
- `POST /api/operations/:id/check-availability` (Checks stock availability)
- `POST /api/operations/:id/validate` (Applies stock moves atomically, transitions $\rightarrow$ DONE)
- `POST /api/operations/:id/cancel` (Transitions to CANCELED, unreserves stock)

### 3.3 Adjustments (`/api/adjustments`)
- `GET /api/adjustments`
- `POST /api/adjustments`
  - Body: `{ "locationId": "uuid", "reason": "string", "notes"?: "string", "lines": [{ "productId": "uuid", "countedQuantity": 15 }] }`
  - Automatically executes delta moves and sets status `DONE`.

---

## 4. Products, Stock & Intelligence Endpoints (Member 3 — Stubs Present, 501)

### 4.1 Categories & Products (`/api/categories`, `/api/products`)
- `GET|POST /api/categories`, `GET|PATCH|DELETE /api/categories/:id`
- `GET /api/products?search&categoryId&stockStatus=IN_STOCK|LOW|OUT&page`
- `POST /api/products` (Accepts optional `initialStock` and `locationId`)
- `GET|PATCH|DELETE /api/products/:id`
- `GET /api/products/:id/stock` (Breakdown per internal location)
- `GET /api/products/:id/moves` (Ledger history for this product)
- `POST /api/products/bulk` (CSV import as JSON array)
- `GET /api/products/export` (CSV file download)

### 4.2 Reorder Rules (`/api/reorder-rules`)
- `GET|POST /api/reorder-rules`, `GET|PATCH|DELETE /api/reorder-rules/:id`

### 4.3 Stock & Move History (`/api/stock`, `/api/moves`)
- `GET /api/stock?warehouseId&locationId&categoryId&search`
- `GET /api/stock/export` (CSV export)
- `GET /api/moves?search&type&productId&locationId&dateFrom&dateTo&includePending&page`
- `GET /api/moves/board`
- `GET /api/moves/export` (CSV export)

### 4.4 Dashboard & Smart Features (`/api/dashboard`, `/api/replenishment`, `/api/notifications`, `/api/search`)
- `GET /api/dashboard/summary` (High-level counts & stock valuations)
- `GET /api/dashboard/operation-cards` (Receipt and Delivery operational counters)
- `GET /api/dashboard/trends?days=30` (Historical movement chart data)
- `GET /api/dashboard/top-products`
- `GET /api/replenishment` (Auto-generated replenishment purchase suggestions)
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`
- `GET /api/search?q=` (Global Ctrl+K search index)
