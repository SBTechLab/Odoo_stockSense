# StockSense — Real-Time Inventory Management System

> Enterprise-grade inventory control built for operational speed, high data density, and double-entry accuracy.  
> Developed for the 8-hour hackathon by a 3-person team executing in sequential progression.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20+ (ESM support)
- **PostgreSQL** 18+ running locally (e.g. `localhost:5432`)
- **npm** v10+

### 1. Install Dependencies
From the repository root:
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` in `server/` to `server/.env`:
```bash
cd server
cp .env.example .env
```
Ensure `DATABASE_URL` matches your local PostgreSQL credentials, for example:
```env
DATABASE_URL="postgresql://postgres:Smit@localhost:5432/stocksense_dev?schema=public"
JWT_SECRET="e522d67b038e6dc7e4a8a173d01511d2a175854b479a4ecdb2d71b9ec208661031955d091358f960d345e0dd024f4254"
```

### 3. Initialize Database & Seed
Run migrations and load the idempotent seed data (initial users, warehouses, locations):
```bash
# From repo root:
npm run db:migrate
npm run db:seed
```

### 4. Start Development Servers
```bash
npm run dev
```
- **Backend API:** `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)
- **Frontend App:** `http://localhost:5173` (Vite proxies `/api` to port 5000)

---

## 🔑 Demo Credentials

| Role | Login ID | Email | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin01` | `admin@stocksense.local` | `Admin@1234` | Full access, user management, warehouse & location master data |
| **Inventory Manager** | `manager01` | `manager@stocksense.local` | `Manager@1234` | Master data, operations confirmation & validation, adjustments |
| **Warehouse Staff** | `staff001` | `staff@stocksense.local` | `Staff@1234` | Operations execution, physical inventory counts, printing slips |

---

## 👥 Team Ownership & Sequential Workflow

We push directly to `main` sequentially:
- **Member 1 (Foundation):** Core architecture, complete Prisma schema & migrations, auth (login, signup, OTP reset, profile), settings (warehouses, locations, user management, activity log), UI component kit, and layout shell.
- **Member 2 (Operations):** Receipts, Deliveries, Internal Transfers, Inventory Adjustments, Contacts, Stock availability checking, and Printable slips.
- **Member 3 (Products & Intelligence):** Product catalog, categories, real-time stock valuation, immutable move history, dashboard KPI cards & trends, automated replenishment, and global search (Ctrl+K).

---

## 🛠 Project Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both Express backend and Vite frontend concurrently |
| `npm run db:migrate` | Runs Prisma migrations in development mode |
| `npm run db:seed` | Seeds users, virtual locations, and warehouse topology |
| `npm run db:studio` | Opens Prisma Studio web GUI to browse database tables |
| `npm run lint` | Runs ESLint across both server and client |
| `npm run build` | Compiles client for production via Vite |

---

## 📚 Technical Documentation

Detailed specifications and architectural guides are located in `/docs`:
- [`PRD.md`](docs/PRD.md) — Product requirements, personas, scope, and end-to-end flows.
- [`DESIGN.md`](docs/DESIGN.md) — Design tokens, typography, status colors, and page patterns.
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Double-entry stock engine, state machines, and request lifecycle.
- [`API.md`](docs/API.md) — Complete REST API contract for all modules.
- [`DECISIONS.md`](docs/DECISIONS.md) — Architectural Decision Records (ADRs).
- [`CONTRIBUTING.md`](docs/CONTRIBUTING.md) — Git conventions and collaboration rules.
- [`PROGRESS.md`](docs/PROGRESS.md) — Step-by-step handoff log for Members 2 and 3.
