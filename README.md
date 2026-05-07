# SkillBridge – Attendance Management System

A full-stack, role-based attendance management platform for the fictional SkillBridge state-level skilling programme. Built as a take-home assignment for Sustainable Living Lab.

---

## Live URLs

| Service  | URL |
|----------|-----|
| Frontend | `https://skillbridge.vercel.app` _(replace with your deployed URL)_ |
| Backend  | `https://skillbridge-api.up.railway.app` _(replace with your deployed URL)_ |
| API Base | `https://skillbridge-api.up.railway.app/api` |
| Health   | `https://skillbridge-api.up.railway.app/health` |

---

## Test Accounts

All accounts use password: `SkillBridge@2024`

| Role | Email |
|------|-------|
| Student | `student@skillbridge.dev` |
| Trainer | `trainer@skillbridge.dev` |
| Institution | `institution@skillbridge.dev` |
| Programme Manager | `manager@skillbridge.dev` |
| Monitoring Officer | `monitor@skillbridge.dev` |

> Sign in via the landing page → Sign In. After first login, you will be prompted to select your role (only on first use). Use the emails above and the password to log in and pick the corresponding role.

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or a Neon account)
- Redis (or Upstash account)
- Clerk account with a new application

### 1. Clone & install

```bash
git clone <your-repo-url>

cd skillbridge/backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

**Backend** – copy `.env.example` to `.env` and fill in:
```bash
DATABASE_URL="postgresql://..."      # Neon or local Postgres connection string
CLERK_SECRET_KEY="sk_test_..."       # From Clerk Dashboard > API Keys
CLERK_PUBLISHABLE_KEY="pk_test_..."  # From Clerk Dashboard > API Keys
REDIS_URL="redis://localhost:6379"   # Local Redis or Upstash URL
FRONTEND_URL="http://localhost:5173"
PORT=3001
NODE_ENV=development
```

**Frontend** – copy `.env.example` to `.env.local`:
```bash
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."   # Same as backend
VITE_API_BASE_URL="http://localhost:3001/api"
```

### 3. Set up the database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to DB (dev)
npm run db:push

# Or run migrations (production-safe)
npm run db:migrate
```

### 4. Start development servers

```bash
# Terminal 1 – Backend
cd backend && npm run dev

# Terminal 2 – Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend:  http://localhost:3001  
Health:   http://localhost:3001/health

### 5. Seed test data (optional)

After creating accounts via the UI, update `prisma/seed.ts` with the actual `clerkUserId` values from your Clerk dashboard and run:

```bash
cd backend && npm run db:seed
```

---

## Schema Design Decisions

### Why `institutionId` on `users` for two purposes?

The `users.institution_id` field is nullable and serves a dual role:
- For `TRAINER` and `STUDENT` users → points to the institution they belong to (a `User` with role `INSTITUTION`)
- For `INSTITUTION` users → is `null` (they are the root)

This avoids a separate `institutions` table and keeps the hierarchy flat, which is appropriate for this scale.

### Self-referential User relation

`User` relates to `User` via `InstitutionUsers` — a trainer's `institutionId` points to an institution user's `id`. This is a soft foreign key enforced at the API layer rather than a rigid DB constraint to allow trainers to be unassigned.

### Invite Links as a first-class entity

`InviteLink` is its own table rather than a field on `Batch`. This enables:
- Expiry dates
- Usage counting / max-use cap
- Audit trail of who generated each link
- Multiple active links per batch

### Attendance is upsertable

`attendance` has a unique constraint on `(session_id, student_id)`. Students can update their status (PRESENT → LATE or vice versa) within 24 hours of the session, using a Prisma `upsert`. This prevents duplicate records and allows correction.

### `BatchTrainer` is many-to-many

A batch can have multiple trainers (e.g. primary + assistant). This is stored in a junction table rather than a simple FK on `sessions`.

---

## Stack Choices

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite | Fast HMR, modern tooling, wide ecosystem |
| Styling | Tailwind CSS | Utility-first, consistent design system, no runtime cost |
| State | Zustand | Minimal boilerplate, simple global state for auth |
| Server state | TanStack Query | Caching, background refetching, loading/error states |
| Backend | Express + TypeScript | Familiar, lightweight, full type safety |
| ORM | Prisma | Type-safe queries, schema-first, great DX for PostgreSQL |
| Auth | Clerk | Handles JWT, social login, session management out of the box |
| Database | PostgreSQL (Neon) | Relational data fits perfectly; Neon has serverless free tier |
| Cache + Rate limit | Redis (Upstash) | User profile cache (300s TTL), Redis-backed rate limiting |
| Validation | Zod | Runtime type safety on all API inputs |
| Logging | Winston | Structured logs, easy to pipe to a log aggregator |
| Deployment | Vercel (FE) + Railway (BE) | Both have free tiers, GitHub auto-deploy, zero-config |

---

## What is Working

✅ All 5 roles can sign up, log in, and see their respective dashboard  
✅ Authentication via Clerk with backend JWT verification  
✅ Role-based access control enforced server-side on every endpoint  
✅ Batch creation (Trainer + Institution)  
✅ Invite link generation and student join flow  
✅ Session creation (Trainer)  
✅ Student attendance marking (PRESENT / LATE) with 24h time gate  
✅ Session attendance view for Trainers  
✅ Batch summary for Institution  
✅ Programme-wide summary for Programme Manager + Monitoring Officer  
✅ Redis caching on user profiles and summary endpoints  
✅ Rate limiting (global 100/15min, auth 20/15min, attendance 5/min)  
✅ Recharts visualisation on PM + MO dashboards  
✅ Monitoring Officer has zero create/edit/delete UI affordances  

## What is Partially Done

⚠ `JoinBatchPage` uses `/batches/undefined/join` — the correct route should extract batchId from the invite lookup. Fix: add a `GET /invite/:token` endpoint that resolves the batch before posting to join.  
⚠ Trainer assignment to institution is API-complete but the UI is not built (would be an Institution admin panel feature).  
⚠ No email notifications on invite acceptance.

## What was Skipped

❌ Admin panel for Programme Manager to create institutions  
❌ Pagination on large tables (added `take: 100` as a safety cap)  
❌ File export (CSV attendance report)  
❌ Real-time updates via WebSocket (polling via React Query is used instead)  
❌ Password reset flow (handled by Clerk UI, not custom-built)

---

## One Thing I'd Do Differently

The invite-join flow currently has a two-step: the frontend calls `/batches/:id/join` with a token, but the `:id` is actually a placeholder because the batch ID must first be resolved from the token server-side. I would add a dedicated `GET /invite/:token` endpoint that returns the batch details before the student confirms joining — cleaner UX and correct routing.

---

## Deployment Guide

### Backend (Railway)

1. Push code to GitHub
2. New project on Railway → Deploy from GitHub → select `/backend`
3. Add environment variables (DATABASE_URL, CLERK_SECRET_KEY, REDIS_URL, etc.)
4. Railway auto-detects Node.js and runs the `railway.json` start command
5. `prisma migrate deploy` runs on every deploy

### Frontend (Vercel)

1. New project on Vercel → import GitHub repo → set root to `/frontend`
2. Add `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_BASE_URL` as environment variables
3. Vercel auto-detects Vite and deploys

### Clerk Setup

1. Create a new Clerk application
2. Enable Email/Password sign-in
3. Under JWT Templates → create a template named `default`
4. Under API Keys → copy Publishable Key and Secret Key

### Database (Neon)

1. Create a new project on neon.tech
2. Copy the connection string (with `?sslmode=require`)
3. Set as `DATABASE_URL` in Railway env vars