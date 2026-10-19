# FreelanceHub — Task Breakdown

This file is the working checklist for building the app described in [`PRD.md`](./PRD.md). It follows the phase order in PRD §14. Terms follow [`GLOSSARY.md`](../GLOSSARY.md).

## Priority

1. **Foundation**: the monorepo, both apps, and the shared package exist.
2. **Identity**: users, Authentication (Telegram Sign-in), Authorization (RBAC), and Approval.
3. **Dashboard work**: projects, proposals, and the overview.

Phase 3 is the first milestone: a new person signs in, the admin approves them, and they enter the dashboard as a member.

## How each sub-task runs

```
Shared (gate)  ──►  API track  ─┐
                                ├──►  Checkpoint
                    Web track  ─┘
```

- **Shared (gate):** the contract goes first. Add the Zod schemas, inferred types, response types, permissions, and error codes in `packages/shared`. Both tracks start only after this step is merged.
- **API ∥ Web:** the two tracks run in parallel against that contract.
  - The API track writes its own tests.
  - The web app has no mock data (CLAUDE.md), so the Web track is type-checked and unit-tested on its own. It is checked end to end only at the checkpoint.
- **Checkpoint:** wire both tracks together and confirm the "done when" criteria in the running app.
- **Commits:** one commit per track using Conventional Commits (`feat(shared): …`, `feat(api): …`, `feat(web): …`). Every track ends with `pnpm lint`, `pnpm typecheck`, and the relevant tests passing.
- `§` references point to sections of `PRD.md`.

## Prerequisites

- Local MongoDB running as replica set `rs0` (§12). Needed from the Phase 1 checkpoint onward.
- A Telegram bot token, the bot username, and your own `ADMIN_TELEGRAM_ID` (§12). Needed from the 2.2 checkpoint onward. There is no dev login (§1 non-goals).

---

## Phase 0 — Foundation

### 0.1 Workspace (sequential, blocks everything)

- [x] `pnpm-workspace.yaml`, root `package.json` with `dev`, `seed`, `lint`, `format`, `typecheck`, `test` scripts (§3)
- [x] `tsconfig.base.json` (strict), ESLint flat config with typescript-eslint, `.prettierrc` (§2)
- [x] `.gitignore` that ignores `.env` files (§11)

### 0.2 Shared (gate)

- [x] `packages/shared` package wired as `@freelancehub/shared` (§3)
- [x] `constants/`: roles, user statuses, project statuses, categories, types, proposal statuses (§4, §6)
- [x] `constants/project-status.ts`: the status transition map, including "system only" and per-actor transitions (§7)
- [x] `rbac/`: `Permission` string-literal union, `ROLE_PERMISSIONS`, `hasPermission(role, permission)` (§4 RBAC)
- [x] API error codes and the `{ data, meta? }` / `{ error }` envelope types (§8)
- [x] Test: every role in `ROLE_PERMISSIONS` references only defined permissions (§13)

### 0.3 API track

- [x] `config/env.ts`: Zod-validated env that exits with a clear message if invalid. Also add `apps/server/.env.example` (§11, §12)
- [x] `config/db.ts`: Mongoose connect with `strictQuery` on (§11)
- [ ] `lib/`: pino logger, `AppError`, async handler (§3)
- [x] `middleware/`: `validate(schema)` and the central error handler that formats the envelope (§8)
- [x] `app.ts` (helmet, CORS limited to `CLIENT_ORIGIN` with credentials, cookie-parser) and `server.ts` (§3, §11)
- [x] `GET /api/health` → `{ data: { status: "ok", db: "up" } }`, plus a test using `MongoMemoryReplSet` (§8, §13)

### 0.4 Web track

- [x] Vite + React 19 + Tailwind v4 (`@tailwindcss/vite`) + shadcn init, with the Sidebar component added (§2)
- [x] `index.html` with `<meta name="robots" content="noindex, nofollow">` (§11)
- [x] Vite proxy `/api` → `http://localhost:4000`, and `apps/client/.env.example` (§9.2, §12)
- [x] `lib/api.ts` axios instance (`baseURL`, `withCredentials`) and `lib/query-client.ts` (§9.2)
- [x] `router/routes.tsx`: the full route tree from §9.1 with placeholder pages and no middleware yet
- [x] `DashboardLayout` built on shadcn Sidebar with a static nav: fixed and collapsible on `lg+`, a Sheet below `lg` (§9.1.1)
- [x] Dashboard index placeholder with a card that calls `/api/health`

### Checkpoint

- [x] `pnpm dev` runs both apps, and `/dashboard` shows the responsive shell with a working health card.

---

## Phase 1 — Users + seed

### Shared (gate)

- [ ] `schemas/user.ts`: user fields (name 2–60, email, role, status, title) and the public `User` response type (§6)

### API track

- [ ] `modules/users/user.model.ts`: fields, indexes (unique email, telegramId, phone; `{ role, status }`; name), `timestamps`, and a `toJSON` transform that maps `_id` to `id` and drops `__v` (§6)
- [ ] `seed/seed.ts` v1: clears collections, then creates the admin linked to `ADMIN_TELEGRAM_ID`, ~10 owners and ~12 freelancers with `@faker-js/faker` on a fixed seed. Most are approved; 3 pending, 1 rejected, 1 suspended (§10)

### Web track

- [ ] `components/`: `PageHeader`, `EmptyState`, `ErrorState` (§3)
- [ ] `router/errors.tsx`: route `ErrorBoundary` that renders 403, 404, and generic errors **inside** the shell (§9.1.1)
- [ ] Topbar breadcrumbs from route `handle.crumb` (§9.1.1)

### Checkpoint

- [ ] `pnpm seed` creates the users, and an unknown dashboard URL shows a 404 inside the shell.

---

## Phase 2 — Auth + RBAC (top priority)

### 2.1 Guards and RBAC core

**Shared (gate)**

- [ ] `me` response type (current user), `UNAUTHENTICATED` / `ACCOUNT_NOT_APPROVED` / `FORBIDDEN` codes (§8)

**API track**

- [ ] `modules/auth/tokens.ts`: sign and verify the access JWT (`{ sub, role }`, 15 min) (§5.2)
- [ ] `middleware/authenticate.ts`: verifies the token and loads the user from the DB on every request → `401` (§4)
- [ ] `middleware/require-approved.ts` → `403 ACCOUNT_NOT_APPROVED` (§4)
- [ ] `rbac/require-permission.ts`: any-of check → `403 FORBIDDEN` (§4)
- [ ] `rbac/policies.ts` skeleton: pure functions, filled in later phases (§4)
- [ ] `GET /api/auth/me`: authenticated, any status (§8)
- [ ] Test helper that creates a user and mints an access token for each role and status
- [ ] Tests: pending, rejected, and suspended users → `ACCOUNT_NOT_APPROVED`; a test that fails if any `/api` route other than auth or health is registered without `requirePermission` (§11, §13)

**Web track**

- [ ] `features/auth/auth-store.ts`: access token kept in memory only (§5.2)
- [ ] axios request interceptor that attaches `Authorization: Bearer` (§9.2)
- [ ] `router/context.ts`: `userContext` (§9.1)
- [ ] `router/middleware.ts`: `authMiddleware`, `approvedMiddleware`, `requirePermission(...)`, `guestMiddleware`, `statusPageMiddleware`, declared on the parent routes from §9.1
- [ ] Vitest unit tests for each middleware (redirects and 403s) (§13)
- [ ] `hooks/use-can.ts` and `<Can permission>` (§4 client mirror)
- [ ] `router/nav.ts` (label, icon, path, permission) and a sidebar filtered with `hasPermission` (§9.1.1)

**Checkpoint**

- [ ] All API and web tests pass. A real login is not possible yet; that comes in 2.2–2.3.

### 2.2 Telegram Sign-in (Steps 1–2)

**Shared (gate)**

- [ ] Schemas and types for session create, session status, verify `{ sessionId, code }`, and resend `{ sessionId }` (§5.1)

**API track**

- [ ] `AuthSession` model: nonce, status, OTP hash, attempts, resend count, TTL index (§6)
- [ ] `POST /api/auth/telegram/session` → `{ sessionId, deepLink }`, and `GET /api/auth/telegram/session/:sessionId` → `{ status }` (§5.1)
- [ ] `bot/`: grammY long polling, `/start <nonce>`, a `request_contact` keyboard, a `contact.user_id === from.id` check, a 6-digit OTP stored as an HMAC-SHA256 hash, and a fallback message for `/start` without a nonce (§5.1)
- [ ] Optional `TELEGRAM_PROXY_URL` passed to grammY (§5.4)
- [ ] `bot/notifier.ts`: injectable notifier service. A send failure is logged and never fails the request. Tests use a test double (§5.3, §13)
- [ ] `POST /api/auth/telegram/verify`: constant-time comparison, 5 attempts → `locked`, expired OTP rejected (§5.1)
- [ ] `POST /api/auth/telegram/resend`: 60s cooldown, max 3 resends (§5.1)
- [ ] Auth rate limiter (e.g. 20 req / 15 min / IP) (§11)
- [ ] Tests: OTP attempts lock the session, expired OTP, resend limits. Drive the bot handlers and session service directly (§13)

**Web track**

- [ ] `pnpm add qrcode.react --filter client`
- [ ] `features/auth/AuthPage.tsx` stepper inside `AuthLayout` (§5.1)
- [ ] Step 1: "Open Telegram" button, a QR code of the deep link, and polling every 2s (`refetchInterval`) that moves to Step 2 on `otp_sent`
- [ ] Step 2: OTP input, a resend button with a cooldown countdown, and error messages for locked or expired sessions

**Checkpoint**

- [ ] A real Telegram user opens the deep link, shares their contact, receives the code, and verifies it in the browser.

### 2.3 Registration and Session lifecycle

**Shared (gate)**

- [ ] Register schema (name, email, role ∈ owner | freelancer, optional title) and response types for verify (`{ user, accessToken }` | `{ needsProfile, registrationToken }`) and refresh (§5.1)

**API track**

- [ ] Registration token: JWT, 15 min, `purpose: "register"`, carries the Telegram data (§5.1)
- [ ] `POST /api/auth/register` → creates a user with status `pending` and issues tokens (§5.1)
- [ ] `RefreshToken` model: hashed token, `familyId`, TTL, `revokedAt`, `replacedBy` (§6)
- [ ] httpOnly refresh cookie (`sameSite=lax`, `secure` in production, `path=/api/auth`) (§5.2)
- [ ] `POST /api/auth/refresh`: rotation, and reuse detection that revokes the whole family (§5.2)
- [ ] `POST /api/auth/logout`: revokes the family and clears the cookie (§5.2)
- [ ] Tests: register, refresh rotation, reused refresh token revokes the family, logout (§13)

**Web track**

- [ ] Step 3: profile form with React Hook Form + `zodResolver`, with server `details` mapped to fields (§5.1, §9.4)
- [ ] `lib/session.ts`: single-flight `refreshSession()`, plus a 401 response interceptor that retries once and goes to `/auth` if refresh fails (§5.2)
- [ ] Silent login on app load, and a root `HydrateFallback` so the login page never flashes for a signed-in user (§9.1)
- [ ] Redirect after sign-in: `approved` → `redirectTo` (only a safe internal path) or `/dashboard`, otherwise → `/account-status` (§5.1, §9.1)
- [ ] `features/auth/AccountStatusPage.tsx`: pending, rejected (with reason), and suspended screens, plus logout (§9.1)
- [ ] Topbar user menu: initials, name, role badge, logout (API call, clear the store, `queryClient.clear()`) (§9.1.1)
- [ ] A `403 ACCOUNT_NOT_APPROVED` received mid-session invalidates `me` and redirects to `/account-status` (§9.1)

**Checkpoint**

- [ ] A new user registers through Telegram and lands on the pending screen.
- [ ] A returning user (the seeded admin) signs in, and a reload keeps the session.
- [ ] A direct URL to a forbidden page shows 403 inside the shell.

---

## Phase 3 — Admin approval (milestone: sign in → dashboard)

### Shared (gate)

- [ ] User list query schema (`status`, `role`, `q`, pagination) and status-change body `{ status, reason? }` (§8 Users)

### API track

- [ ] `GET /api/users` [`user:read`]: filters, newest first, paginated (§8)
- [ ] `GET /api/users/pending-count` [`user:read`] (§8)
- [ ] `PATCH /api/users/:id/status` [`user:manage`]: approve, reject with optional reason, suspend, and re-approve. Admins cannot change their own status or another admin's. Suspending revokes all refresh tokens. Set `reviewedBy` and `reviewedAt` (§4, §5.2, §8)
- [ ] Notifications: every admin is told about a new registration, with a link to `/dashboard/users?status=pending`. The user is told about the approve or reject decision (§5.3)
- [ ] Table-driven RBAC test of each role against the user endpoints (allowed vs 403) (§13)

### Web track

- [ ] `features/users/`: `api.ts`, `hooks.ts`, and a `userKeys` query key factory (§9.2)
- [ ] Users page: status tabs (default Pending), search by name or email, a table on desktop and cards on mobile, all state in URL search params (§9.5)
- [ ] Actions: Approve, Reject (dialog with optional reason), Suspend (confirmation), with Sonner toasts (§9.5, §9.2)
- [ ] Pending-count badge on the sidebar "Users" item (§9.1.1)

### Checkpoint

- [ ] The admin gets a Telegram message, approves the new user, and that user then reaches `/dashboard`.

---

## Phase 4 — Projects data + browser

### 4.1 Project and proposal data

**Shared (gate)**

- [ ] Project and proposal field schemas, the project list query schema (§8 table), `ProjectListItem`, and the paginated `meta` type (§6, §8)

**API track**

- [ ] `Project` model with indexes, and `Proposal` model with the unique `{ project, freelancer }` index (§6)
- [ ] Seed v2: 40 projects across all categories, types, and statuses, with consistent freelancers and proposals, realistic titles, prices, and dates (some overdue) (§10)

**Web track**

- [ ] Presentational components built against the shared types: toolbar, table, card, status badge, price and deadline formatting, pagination (§9.3)

### 4.2 Projects browser

**API track**

- [ ] `projects/query-builder.ts`: `$match` → `$lookup` owner and freelancer → `$unwind` → `q` match → `$facet` with a stable sort (§8)
- [ ] `GET /api/projects` [`project:read`]: regex input escaped, `limit` capped, sort fields whitelisted (§8, §11)
- [ ] Tests: each filter, search across title, owner, and freelancer, both sorts in both directions, pagination meta, invalid params → 400 (§13)

**Web track**

- [ ] `features/projects/`: `api.ts`, `hooks.ts`, a `projectKeys` factory, and `keepPreviousData` (§9.2)
- [ ] Projects page: all state in URL search params, any filter change resets to page 1, search debounced 300ms, Reset filters, and an All/Mine scope toggle (§9.3)
- [ ] Sortable Created and Price headers as buttons with `aria-sort`, and a Sort select on mobile (§9.3)
- [ ] "Showing X–Y of Z", page-size select, and loading, empty, and error states (§9.3)

### Checkpoint

- [ ] Search, filter, sort, and pagination all work on mobile and desktop against the seeded data.

---

## Phase 5 — Project CRUD + status

### Shared (gate)

- [ ] Create and update project schemas (deadline in the future, max 10 skills), status body schema, and a helper that lists the transitions an actor may take (§6, §7)

### API track

- [ ] `rbac/policies.ts`: `canUpdateProject`, `canDeleteProject`, `canChangeProjectStatus`, each with unit tests (§4)
- [ ] `POST`, `PATCH`, and `DELETE /api/projects/:id`. The admin must set `ownerId`. Owners can edit only while `open` or `closed`. Delete is refused if a proposal was accepted, and it removes related proposals (§4, §8)
- [ ] `GET /api/projects/:id` with `allowedActions` computed by the policies (§8)
- [ ] `PATCH /api/projects/:id/status`: invalid transitions → `409 INVALID_STATUS_TRANSITION` (§7)
- [ ] Tests: every allowed transition succeeds and a sample of disallowed ones return 409; table-driven RBAC for the project endpoints (§13)

### Web track

- [ ] Project details page: status action buttons and edit/delete driven by `allowedActions` (§9.1, §7)
- [ ] Create and edit form (date picker, tag input for skills) with server errors mapped to fields. The edit loader checks for `update` in `allowedActions` (§9.1, §9.4)
- [ ] "New project" primary action guarded by `<Can>` (§9.1.1)

### Checkpoint

- [ ] RBAC, ownership, and transition rules are enforced and tested, and the UI shows only the actions the server allows.

---

## Phase 6 — Proposals

### Shared (gate)

- [ ] Proposal create schema (cover letter 50–2000, bid amount, 1–365 days) and the proposal list query schema (§6, §8)

### API track

- [ ] `GET` and `POST /api/projects/:id/proposals`: the project must be `open`, and a duplicate → `409 DUPLICATE_PROPOSAL` (§8)
- [ ] `GET /api/proposals/me` and `PATCH /api/proposals/:id/withdraw` (own proposals, pending only) (§8)
- [ ] `PATCH /api/proposals/:id/accept`: one transaction that accepts this proposal, rejects the others, assigns the freelancer, and moves the project to `in-progress`. It guards against a double accept and notifies the freelancer (§8)
- [ ] `PATCH /api/proposals/:id/reject` (pending only) (§8)
- [ ] Tests: duplicate → 409, the accept transaction, double accept guarded, RBAC table (§13)

### Web track

- [ ] Proposal form on project details, shown to freelancers when the project is open and they have no proposal yet (§9.4)
- [ ] Proposals list on project details with Accept and Reject for reviewers (§8)
- [ ] My proposals page with a status filter and Withdraw. Mutations invalidate the project detail, list, and proposal keys (§9.2)

### Checkpoint

- [ ] The full hire flow works end to end: submit → accept → project `in-progress` → the freelancer is notified.

---

## Phase 7 — Overview

### Shared (gate)

- [ ] A stats response type that differs by role (admin, owner, freelancer) (§8 Dashboard)

### API track

- [ ] `GET /api/dashboard/stats` [`dashboard:read`] with stats chosen by permission, plus tests (§8)

### Web track

- [ ] Overview page: stat cards for each role, a "Recent projects" list, skeletons while loading. Replaces the Phase 0 health card (§9.1.2)

### Checkpoint

- [ ] Each role sees its own stats.

---

## Phase 8 — Polish

- [ ] Accessibility pass: labelled inputs, header buttons, `aria-sort`, focus states (§9.6)
- [ ] Empty and error states on every page; check that no page scrolls horizontally on mobile (§9.6)
- [ ] README: MongoDB replica set setup, Telegram bot setup, scripts, architecture (§12)

### Checkpoint

- [ ] A fresh clone plus the README steps gives a running app.
