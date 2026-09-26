# StockSense — Team Contributing Guidelines & Git Protocol

> **Target Audience:** All 3 Team Members  
> **Workflow Model:** Strictly Sequential Direct-to-Main

---

## 1. Golden Rules of Development

1. **Always `git pull origin main` before you start and before every single push.**
2. **Commit and push after every finished feature**, not once at the end of the day. This guarantees visible commits for hackathon judges inspecting commit trajectories.
3. **While another member is actively executing their prompt, only touch your designated files.**
4. **Never commit `.env` or secrets.** Each member runs their own local PostgreSQL database (`stocksense_dev`).
5. **Never edit existing Prisma migrations.** If a schema change is needed after Member 1's foundation, create a new migration (`npx prisma migrate dev --name your_change`), mention it in the commit message, and notify teammates to run `npm run db:migrate`.

---

## 2. Team Member Ownership & Sequential Hand-off

| Member | Focus Area | Exclusive File Ownership | Status |
| :--- | :--- | :--- | :--- |
| **Member 1** (You) | Foundation, Architecture, Auth, Settings, Database, UI Kit | `docs/`, `server/prisma/`, `server/src/lib/`, `server/src/middleware/`, `server/src/services/`, `server/src/modules/auth/`, `users/`, `warehouses/`, `locations/`, `activity/`, `events/`, `client/src/components/ui/`, `components/layout/`, `pages/auth/`, `pages/settings/`, `pages/profile/`, `pages/users/` | **COMPLETE** |
| **Member 2** | Operations, Movements, Contacts & Slips | `server/src/modules/contacts/`, `operations/`, `adjustments/`, `client/src/components/operations/`, `client/src/pages/operations/`, `client/src/pages/contacts/` | Ready to start |
| **Member 3** | Products, Stock, Dashboard & Intelligence | `server/src/jobs/`, `server/src/modules/categories/`, `products/`, `reorder-rules/`, `stock/`, `moves/`, `dashboard/`, `replenishment/`, `notifications/`, `search/`, `client/src/components/products/`, `dashboard/`, `notifications/`, `search/`, `pages/dashboard/`, `pages/products/`, `pages/stock/`, `pages/moves/`, `pages/replenishment/` | Queued after M2 |

---

## 3. Commit Message Standards

All commits must follow the **Conventional Commits** specification:
- `feat:` A new user-facing feature or API endpoint.
- `fix:` A bug fix.
- `docs:` Documentation additions or updates.
- `refactor:` Code improvements without behavioral changes.
- `chore:` Dependency updates, config tweaks, seed scripts.

**Examples:**
- `feat(auth): add 6-digit OTP password reset flow`
- `feat(operations): add check availability and reservation engine`
- `docs(api): document adjustments endpoints`

---

## 4. Git Command Flow Reference

### Before Starting Work:
```bash
git pull origin main
```

### After Finishing a Feature:
```bash
git status
git add <files-you-touched>
git commit -m "feat(module): description of feature"
git pull origin main --rebase
git push origin main
```

---

## 5. Local Setup Checklist

```bash
# 1. Install dependencies from repo root
npm install

# 2. Configure server environment
cd server
cp .env.example .env
# Ensure DATABASE_URL points to your local postgres instance

# 3. Apply database migrations & seed
npm run db:migrate
npm run db:seed

# 4. Start development servers
cd ..
npm run dev
```
