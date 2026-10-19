# PRD: FreelanceHub — Freelance Projects Marketplace (Fullstack Monorepo)

Version: 1.0
Language / direction: English, LTR
Purpose: Course project for a Claude Code course. Code quality, clear structure, and incremental phases matter as much as features.
Type: **Internal company application.** Everything except the auth screens lives inside an authenticated dashboard shell. There is no public landing page or public content.

---

## 1. Overview

FreelanceHub is an internal company dashboard where **owners** post freelance projects (web development, UI/UX, SEO, etc.), **freelancers** browse projects and submit proposals, and an **admin** approves new members and oversees everything. Only people the admin approves can use the app.

Users sign in **only through Telegram**: a bot verifies the user with a one-time code (OTP). There are no passwords. New users pick a role (owner or freelancer) and must be approved by an admin before they can enter the dashboard.

The app is protected on **both sides**:

- **Server:** a permission-based RBAC system (roles → permissions, plus ownership policies) authorizes every request. This is the real security boundary.
- **Client:** React Router route **middleware** guards every dashboard route (authenticated → approved → has permission) before any loader or component runs. This is UX, not security.

The core screen is a **projects browser** inside the dashboard shell: server-side search, filtering, sorting, and pagination, displayed as a responsive table (desktop) or cards (mobile).

### Goals

- A realistic, production-style fullstack TypeScript monorepo that students can read and extend.
- Real API calls only. No local/mock data in the frontend.
- Secure auth: access token in memory, refresh token in httpOnly cookie with rotation.
- One RBAC permission map in `packages/shared`, enforced by the server and mirrored by client route middleware and UI.
- Shared Zod schemas and types between client and server.

### Non-goals (v1)

Payments, chat/messaging, file uploads, email sending or verification, in-app notification center, i18n/RTL, real-time updates (websockets), Telegram-free dev login.

---

## 2. Tech Stack

| Layer        | Choice                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Monorepo     | pnpm workspaces                                                                                                                                                                                                                |
| Language     | TypeScript (strict) everywhere                                                                                                                                                                                                 |
| Runtime      | Node.js 22 LTS                                                                                                                                                                                                                 |
| API          | Express 5, Mongoose 8, Zod, jsonwebtoken, cookie-parser, helmet, cors, express-rate-limit, pino (logging)                                                                                                                      |
| Telegram bot | grammY (long polling, runs inside the API process)                                                                                                                                                                             |
| Database     | MongoDB, installed locally, **running as a single-node replica set** (required for transactions)                                                                                                                               |
| Web          | Vite, React 19, React Router ≥ 7.9 (data mode, `createBrowserRouter`, route `middleware` + `loader`), TanStack Query v5, axios, React Hook Form, Zod, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, lucide-react, date-fns, qrcode.react |
| Quality      | ESLint (flat config, typescript-eslint), Prettier                                                                                                                                                                              |
| Tests        | Vitest + Supertest for the API, `mongodb-memory-server` (`MongoMemoryReplSet`) for an isolated test DB                                                                                                                         |

---

## 3. Monorepo Structure

```
freelancehub/
  apps/
    api/
      src/
        config/          env.ts (Zod-validated env), db.ts
        modules/
          auth/          routes, controller, service, telegram-session model, tokens
          users/         model, routes, controller, service
          projects/      model, routes, controller, service, query-builder (aggregation)
          proposals/     model, routes, controller, service
          dashboard/     role-based stats for the overview page
        rbac/            requirePermission middleware, ownership policies (policies.ts)
        bot/             grammY bot setup, handlers (/start, contact), notifier service
        middleware/      authenticate, requireApproved, validate(schema), errorHandler, rateLimit
        lib/             AppError, async handler, crypto helpers, logger
        seed/            seed.ts + seed data
        app.ts           express app (no listen; used by tests)
        server.ts        connect DB, start bot, listen
      tests/
    web/
      src/
        components/ui/   shadcn components
        components/      shared pieces (PageHeader, EmptyState, ErrorState, Can)
        layouts/         DashboardLayout (sidebar + topbar + outlet), AuthLayout
        features/
          auth/          AuthPage (stepper), AccountStatusPage, hooks, api, auth store (in-memory token)
          dashboard/     overview page (stat cards, recent items), hooks, api
          projects/      list page, toolbar, table, card, form, details page, hooks, api
          proposals/     proposal form, proposals list, my proposals page, hooks, api
          users/         users approval page (admin), hooks, api
        lib/             axios instance + interceptors, query client, session (single-flight refresh), utils
        router/
          context.ts     userContext (React Router createContext)
          middleware.ts  authMiddleware, approvedMiddleware, requirePermission(...), guestMiddleware, statusPageMiddleware
          nav.ts         sidebar nav config (label, icon, path, permission)
          routes.tsx     route tree (createBrowserRouter)
          errors.tsx     route ErrorBoundary (403 / 404 / generic)
        hooks/           useCurrentUser, useCan
        main.tsx
  packages/
    shared/
      src/
        constants/       roles, user statuses, project statuses/categories/types, proposal statuses, status transition map
        rbac/            permissions, ROLE_PERMISSIONS map, hasPermission()
        schemas/         Zod schemas (auth, project, proposal, query params, user)
        types/           inferred types + API response types
        index.ts
  docs/PRD.md
  CLAUDE.md
  package.json, pnpm-workspace.yaml, tsconfig.base.json, eslint.config.js, .prettierrc
```

Rule: anything both sides need (enums, schemas, transition rules, response types) lives in `packages/shared` and is imported as `@freelancehub/shared`.

---

## 4. Roles, User Status, and Permissions

### Roles

- `admin` — created only by the seed script (linked to `ADMIN_TELEGRAM_ID`). Approves/rejects/suspends users, can manage any project.
- `owner` — posts and manages their own projects, reviews proposals.
- `freelancer` — browses projects, submits proposals, works on assigned projects.

### User status

- `pending` — registered, waiting for admin review (default after registration).
- `approved` — full access according to role.
- `rejected` — cannot use the dashboard; sees a rejection screen (with optional reason).
- `suspended` — previously approved, blocked by admin; all refresh tokens revoked.

Pending and rejected users **can log in** but only reach the status screen. Every dashboard endpoint is protected by `requireApproved`.

### Permission matrix

| Action                         | Admin                     | Owner                                 | Freelancer                                    |
| ------------------------------ | ------------------------- | ------------------------------------- | --------------------------------------------- |
| Browse/search all projects     | ✅                        | ✅                                    | ✅                                            |
| View project details           | ✅                        | ✅                                    | ✅                                            |
| Create project                 | ✅ (must set ownerId)     | ✅ (owner = self)                     | ❌                                            |
| Edit project                   | ✅ any                    | ✅ own, only while `open` or `closed` | ❌                                            |
| Delete project                 | ✅ any                    | ✅ own, only if no accepted proposal  | ❌                                            |
| Change project status          | ✅ any allowed transition | ✅ own, owner transitions only        | ✅ assigned only, freelancer transitions only |
| Submit / withdraw proposal     | ❌                        | ❌                                    | ✅ own, project must be `open`                |
| List proposals of a project    | ✅                        | ✅ own projects                       | ❌ (sees only own via "My proposals")         |
| Accept / reject proposal       | ✅                        | ✅ own projects                       | ❌                                            |
| List users, change user status | ✅                        | ❌                                    | ❌                                            |

### RBAC system

Authorization is **permission-based**, not role-based in code. Routes and UI ask "does this user have permission X?", never "is this user an admin?". Roles are only a way to group permissions.

**Permissions** (defined once in `packages/shared/src/rbac/permissions.ts` as a string-literal union):

| Permission                                                              | Admin | Owner | Freelancer |
| ----------------------------------------------------------------------- | ----- | ----- | ---------- |
| `dashboard:read`                                                        | ✅    | ✅    | ✅         |
| `project:read`                                                          | ✅    | ✅    | ✅         |
| `project:create`                                                        | ✅    | ✅    |            |
| `project:update:own` / `project:delete:own`                             |       | ✅    |            |
| `project:update:any` / `project:delete:any`                             | ✅    |       |            |
| `project:status:own` (owner transitions on own projects)                |       | ✅    |            |
| `project:status:assigned` (freelancer transitions on assigned projects) |       |       | ✅         |
| `project:status:any`                                                    | ✅    |       |            |
| `proposal:create` / `proposal:withdraw:own` / `proposal:read:own`       |       |       | ✅         |
| `proposal:read:project` / `proposal:review:project` (on own projects)   |       | ✅    |            |
| `proposal:read:any` / `proposal:review:any`                             | ✅    |       |            |
| `user:read` / `user:manage`                                             | ✅    |       |            |

`ROLE_PERMISSIONS: Record<Role, readonly Permission[]>` and `hasPermission(role, permission)` are exported from `@freelancehub/shared` and used by both apps.

**Server enforcement (the security boundary)** — three layers on every protected route:

1. `authenticate` — verifies the access token and loads the user from the DB on every request, so role/status changes take effect immediately. Missing/invalid token → `401 UNAUTHENTICATED`.
2. `requireApproved` — `status !== approved` → `403 ACCOUNT_NOT_APPROVED`.
3. `requirePermission(...permissions)` — passes if the user's role has **any** of the listed permissions, otherwise `403 FORBIDDEN`. Every protected route declares its permissions explicitly in the route file.

**Ownership policies** — permissions with `:own`, `:assigned`, or `:project` scope also need a resource check. These live in `apps/api/src/rbac/policies.ts` as pure functions, e.g.:

- `canUpdateProject(user, project)` → has `project:update:any`, or has `project:update:own` and `project.owner === user.id` (and status rules from section 4 table).
- `canChangeProjectStatus(user, project, nextStatus)` → combines the scoped permission with the transition map (section 7).
- `canReviewProposal(user, project)`.

Services load the resource and call the policy; a failed policy throws `403 FORBIDDEN`. Policies are unit tested without HTTP.

**Client mirror (UX only)** — the same shared map powers `useCan(permission)`, the `<Can permission="...">` component, sidebar nav filtering, and the `requirePermission` route middleware (section 9.1). Hiding a button never replaces a server check.

---

## 5. Authentication (Telegram OTP, no passwords)

### 5.1 Flow

One public route, `/auth`, rendered as a stepper with three tabs. Login and registration are the same flow; the server decides the branch.

**Step 1 — Connect Telegram**

1. Client calls `POST /api/auth/telegram/session`.
2. Server creates an `AuthSession` with a random URL-safe `nonce` (≤ 64 chars, `[A-Za-z0-9_-]`), status `awaiting_contact`, expiry 10 minutes. Returns `{ sessionId, deepLink }` where `deepLink = https://t.me/<BOT_USERNAME>?start=<nonce>`.
3. UI shows an "Open Telegram" button (and a QR code of the deep link for desktop users).
4. Client polls `GET /api/auth/telegram/session/:sessionId` every 2s (TanStack Query `refetchInterval`) and auto-switches to Step 2 when status becomes `otp_sent`.

**In the bot** 5. Bot receives `/start <nonce>`, finds the session, replies with a "Share my contact" button (`request_contact` keyboard). 6. User shares contact. Bot verifies `contact.user_id === from.id` (rejects sharing someone else's contact). 7. Bot stores `telegramId`, `phone`, `username`, `firstName` on the session, generates a 6-digit OTP, stores only its HMAC-SHA256 hash, sets OTP expiry (2 minutes), sends the code, and sets session status `otp_sent`. 8. `/start` without a valid nonce → bot replies with instructions to start from the website.

**Step 2 — Enter OTP** 9. Client calls `POST /api/auth/telegram/verify { sessionId, code }`.

- Max 5 attempts per session, then status `locked`.
- Constant-time comparison.
- `POST /api/auth/telegram/resend { sessionId }` → new code, 60s cooldown, max 3 resends.

10. On success:
    - **Existing user** (by `telegramId`) → issue tokens, return `{ user, accessToken }`. Done.
    - **New user** → return `{ needsProfile: true, registrationToken }` (JWT, 15 min, `purpose: "register"`, contains telegram data). Client switches to Step 3.

**Step 3 — Complete profile (new users only)** 11. Form: name, email (unique, not verified), role (owner | freelancer), optional title (freelancer, e.g. "Frontend Developer"). 12. `POST /api/auth/register { registrationToken, name, email, role, title? }` → creates user with status `pending`, issues tokens, notifies admin(s) via bot. 13. Client redirects by status: `approved` → `/dashboard` (or the `redirectTo` param), otherwise → `/account-status`.

### 5.2 Tokens

- **Access token:** JWT, 15 minutes, payload `{ sub, role }`. Returned in the response body, kept **in memory only** on the client (auth store), never in localStorage.
- **Refresh token:** opaque random 48-byte string, stored hashed (SHA-256) in a `RefreshToken` collection with `userId`, `familyId`, `expiresAt` (7 days), `revokedAt`, `replacedBy`.
  - Sent as httpOnly cookie: `sameSite=lax`, `secure` in production, `path=/api/auth`.
  - **Rotation:** every `POST /api/auth/refresh` revokes the old token and issues a new one in the same family.
  - **Reuse detection:** presenting a revoked token revokes the whole family (forces re-login).
- On app load the client calls `/api/auth/refresh` to restore the session (silent login).
- axios response interceptor: on 401, run a **single-flight** refresh (one refresh for concurrent failing requests), then retry the original request once; if refresh fails → clear auth state → redirect to `/auth`.
- `POST /api/auth/logout` revokes the current refresh token family and clears the cookie.
- Suspending a user revokes all their refresh tokens.

### 5.3 Admin notification

- After a successful registration, the bot sends every admin with a `telegramId` a message: role, name, email, Telegram username, and a link to `<CLIENT_ORIGIN>/dashboard/users?status=pending`.
- When an admin approves or rejects a user, the bot notifies that user.
- Bot send failures (user blocked the bot, network) are logged and never break the API request.
- Admin dashboard also has a pending-users list (see 9.5).

### 5.4 Network note

The API server must reach `api.telegram.org`. Support an optional `TELEGRAM_PROXY_URL` env var passed to grammY's `client.baseFetchConfig.agent` (e.g. via `https-proxy-agent` / `socks-proxy-agent`). There is **no** console/mock OTP mode at runtime. In automated tests the Telegram notifier is replaced by a test double via dependency injection.

---

## 6. Data Model (Mongoose)

All models use `timestamps: true`. IDs are exposed as `id` (string) in API responses via a `toJSON` transform; `__v` removed.

### User

| Field            | Type      | Notes                                  |
| ---------------- | --------- | -------------------------------------- |
| name             | string    | 2–60 chars                             |
| email            | string    | unique, lowercase, not verified        |
| role             | enum      | admin, owner, freelancer               |
| status           | enum      | pending, approved, rejected, suspended |
| title            | string?   | freelancer headline                    |
| telegramId       | string    | unique                                 |
| telegramUsername | string?   |                                        |
| phone            | string    | unique, from shared contact            |
| reviewedBy       | ref User? | admin who approved/rejected            |
| reviewedAt       | Date?     |                                        |
| rejectionReason  | string?   |                                        |

Indexes: unique `email`, `telegramId`, `phone`; `{ role: 1, status: 1 }`; text-friendly `name` index.

### AuthSession

`nonce` (unique), `status` (awaiting_contact, otp_sent, verified, locked, expired), `telegramId?`, `phone?`, `telegramUsername?`, `firstName?`, `otpHash?`, `otpExpiresAt?`, `attempts`, `resendCount`, `lastSentAt?`, `expiresAt` (TTL index).

### RefreshToken

`userId`, `tokenHash` (unique), `familyId`, `expiresAt` (TTL index), `revokedAt?`, `replacedBy?`, `userAgent?`, `ip?`.

### Project

| Field       | Type             | Notes                                                                |
| ----------- | ---------------- | -------------------------------------------------------------------- |
| title       | string           | 5–120 chars                                                          |
| description | string           | 20–5000 chars                                                        |
| category    | enum             | web-development, ui-ux-design, seo, ecommerce, wordpress, mobile-app |
| type        | enum             | fixed-price, hourly                                                  |
| status      | enum             | see 7                                                                |
| price       | number           | USD; budget for fixed-price, hourly rate for hourly                  |
| deadline    | Date             | must be in the future on create                                      |
| skills      | string[]         | optional tags, max 10                                                |
| owner       | ref User         | required                                                             |
| freelancer  | ref User \| null | set only by accepting a proposal                                     |

Indexes: `{ status: 1, category: 1, type: 1 }`, `{ createdAt: -1 }`, `{ price: 1 }`, `{ owner: 1 }`, `{ freelancer: 1 }`.

### Proposal

`project` (ref), `freelancer` (ref), `coverLetter` (50–2000 chars), `bidAmount` (number), `estimatedDays` (1–365), `status` (pending, accepted, rejected, withdrawn).
Unique index `{ project: 1, freelancer: 1 }` (one proposal per freelancer per project).

---

## 7. Project Status Lifecycle

Statuses: `open`, `in-progress`, `in-review`, `completed`, `closed`, `on-hold`, `cancelled`.

Meaning: `open` = accepting proposals; `closed` = owner stopped accepting proposals without hiring (can reopen); `completed` and `cancelled` are terminal.

Transition map (defined once in `packages/shared/constants/projectStatus.ts`):

| From        | To          | Who                                |
| ----------- | ----------- | ---------------------------------- |
| open        | in-progress | system only (accepting a proposal) |
| open        | closed      | owner, admin                       |
| open        | cancelled   | owner, admin                       |
| closed      | open        | owner, admin                       |
| closed      | cancelled   | owner, admin                       |
| in-progress | in-review   | assigned freelancer, admin         |
| in-progress | on-hold     | owner, admin                       |
| in-progress | cancelled   | owner, admin                       |
| on-hold     | in-progress | owner, admin                       |
| in-review   | completed   | owner, admin                       |
| in-review   | in-progress | owner, admin (request changes)     |

`PATCH /projects/:id/status` validates against this map and the actor's role/ownership. Invalid transitions → `409 INVALID_STATUS_TRANSITION`. The UI only shows buttons for transitions the current user is allowed to perform (computed from the same shared map).

---

## 8. API Specification

Base path: `/api`. JSON only.

Success envelope: `{ "data": ..., "meta"?: {...} }`
Error envelope: `{ "error": { "code": "STRING_CODE", "message": "Human readable", "details"?: [...] } }`

Standard codes: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `ACCOUNT_NOT_APPROVED` (403), `NOT_FOUND` (404), `CONFLICT` / `INVALID_STATUS_TRANSITION` / `DUPLICATE_PROPOSAL` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

All request bodies, params, and queries are validated with shared Zod schemas through a `validate()` middleware.

Every non-auth route uses the chain `authenticate → requireApproved → requirePermission(...) → validate(...) → controller`. Permissions per endpoint are listed below in brackets; ownership-scoped ones are completed by a policy in the service.

### Health

- `GET /health` → `{ data: { status: "ok", db: "up" } }`

### Auth (public, rate limited)

- `POST /auth/telegram/session`
- `GET /auth/telegram/session/:sessionId` → `{ status }`
- `POST /auth/telegram/resend`
- `POST /auth/telegram/verify`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me` (authenticated, any status) → current user

### Projects (authenticated + approved)

- `GET /projects` [`project:read`] — list with query params:

| Param    | Values                                                                             | Default   |
| -------- | ---------------------------------------------------------------------------------- | --------- |
| q        | text; matches title, owner.name, freelancer.name (case-insensitive, regex-escaped) | —         |
| status   | one of project statuses                                                            | all       |
| category | one of categories                                                                  | all       |
| type     | fixed-price, hourly                                                                | all       |
| scope    | all, mine (owner: projects I own; freelancer: projects assigned to me)             | all       |
| sort     | createdAt, price                                                                   | createdAt |
| order    | asc, desc                                                                          | desc      |
| page     | ≥ 1                                                                                | 1         |
| limit    | 1–50                                                                               | 10        |

Response: `{ data: ProjectListItem[], meta: { page, limit, total, totalPages } }`
`ProjectListItem` embeds `owner` and `freelancer` as `{ id, name, title? }` (freelancer may be null) plus `proposalCount`.

Implementation: one aggregation pipeline in `projects/query-builder.ts`:

1. `$match` on status/category/type/scope (uses indexes, runs first).
2. `$lookup` owner and freelancer from `users` with a sub-pipeline projecting only `name` and `title`.
3. `$unwind` (freelancer with `preserveNullAndEmptyArrays`).
4. `$match` on `q` across `title`, `owner.name`, `freelancer.name`.
5. `$facet` → `data: [$sort (with _id tiebreaker for stable pagination), $skip, $limit]`, `total: [$count]`.

- `GET /projects/:id` [`project:read`] — full project with owner and freelancer, plus `allowedActions` (e.g. `["update","delete","status:closed"]`) computed by the policies for the current user, so the UI renders exactly what the server will allow.
- `POST /projects` [`project:create`]
- `PATCH /projects/:id` [`project:update:own`, `project:update:any`] — cannot change status, owner, or freelancer here.
- `DELETE /projects/:id` [`project:delete:own`, `project:delete:any`] — own only if no accepted proposal. Deletes related proposals.
- `PATCH /projects/:id/status { status }` [`project:status:own`, `project:status:assigned`, `project:status:any`] — per section 7.

### Proposals (authenticated + approved)

- `GET /projects/:id/proposals` [`proposal:read:project`, `proposal:read:any`] — paginated, includes freelancer `{ id, name, title }`.
- `POST /projects/:id/proposals` [`proposal:create`] — project must be `open`; one per project.
- `GET /proposals/me` [`proposal:read:own`] — own proposals with project summary, filter by status, paginated.
- `PATCH /proposals/:id/withdraw` [`proposal:withdraw:own`] — own, pending only.
- `PATCH /proposals/:id/accept` [`proposal:review:project`, `proposal:review:any`] — **In one MongoDB transaction:** proposal → accepted, all other pending proposals of the project → rejected, project.freelancer = proposal.freelancer, project.status = in-progress. Project must still be `open` (guard against double accept). Notify the freelancer via bot.
- `PATCH /proposals/:id/reject` [`proposal:review:project`, `proposal:review:any`] — pending only.

### Users

- `GET /users` [`user:read`] — filters `status`, `role`, `q` (name/email), paginated, newest first.
- `GET /users/pending-count` [`user:read`] — for the sidebar badge.
- `PATCH /users/:id/status { status, reason? }` [`user:manage`] — approve, reject (reason optional), suspend, re-approve. Cannot change own status or other admins. Notifies the user via bot.

### Dashboard

- `GET /dashboard/stats` [`dashboard:read`] — role-aware overview data:
  - admin: users by status, projects by status, pending proposals count, 5 latest projects.
  - owner: own projects by status, pending proposals on own projects, 5 latest own projects.
  - freelancer: assigned projects by status, own proposals by status, 5 latest open projects.

---

## 9. Frontend

### 9.1 Routes and route middleware

The router uses React Router data mode (`createBrowserRouter`) with **route middleware**. Guards are middleware functions, not wrapper components: they run before any loader or component on every navigation, and they can `throw redirect(...)` or throw a 403 response. Child routes inherit their parent's middleware, so the chain is declared once on the parent route.

> Requires `react-router` ≥ 7.9. If the installed version still needs it, enable the middleware future flag (`future: { v8_middleware: true }`) and follow the version's docs for the exact API names.

**Route tree**

| Path                  | Middleware chain                                                                                                  | Page                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `/`                   | —                                                                                                                 | redirect to `/dashboard`                       |
| `/auth`               | `guestMiddleware`                                                                                                 | Telegram stepper (AuthLayout)                  |
| `/account-status`     | `statusPageMiddleware`                                                                                            | pending / rejected / suspended screen + logout |
| `/dashboard`          | `authMiddleware` → `approvedMiddleware` (inherited by all children)                                               | DashboardLayout                                |
| ├ index               | `requirePermission('dashboard:read')`                                                                             | overview                                       |
| ├ `projects`          | `requirePermission('project:read')`                                                                               | projects browser                               |
| ├ `projects/new`      | `requirePermission('project:create')`                                                                             | create form                                    |
| ├ `projects/:id`      | `requirePermission('project:read')`                                                                               | details, status actions, proposals             |
| ├ `projects/:id/edit` | `requirePermission('project:update:own','project:update:any')` + loader checks `allowedActions` includes `update` | edit form                                      |
| ├ `proposals`         | `requirePermission('proposal:read:own')`                                                                          | my proposals (freelancer)                      |
| └ `users`             | `requirePermission('user:read')`                                                                                  | user approval (admin)                          |
| `*`                   | —                                                                                                                 | 404                                            |

**Middleware** (in `src/router/middleware.ts`):

- `authMiddleware` — if there is no access token in the auth store, calls the shared single-flight `refreshSession()`; then loads the user with `queryClient.ensureQueryData(authKeys.me())` (staleTime 60s). On failure → `throw redirect('/auth?redirectTo=<current path>')`. On success → `context.set(userContext, user)`.
- `approvedMiddleware` — reads `userContext`; `status !== 'approved'` → `throw redirect('/account-status')`.
- `requirePermission(...permissions)` — factory; uses `hasPermission` from `@freelancehub/shared` (any-of). Missing → `throw data(null, { status: 403 })`, rendered by the route `ErrorBoundary` as a Forbidden page **inside** the dashboard shell.
- `guestMiddleware` — already logged in → redirect to `redirectTo` (if it is a safe internal path) or `/dashboard`.
- `statusPageMiddleware` — not logged in → `/auth`; approved → `/dashboard`.
- Loaders read the user with `context.get(userContext)` and prefetch page data with `queryClient.ensureQueryData(...)`; components then use the same TanStack Query hooks.
- Root `HydrateFallback` shows a full-page loader during the first navigation, so the login page never flashes for a logged-in user.
- Logout: call API, clear the auth store, `queryClient.clear()`, navigate to `/auth`.
- If an API call returns `403 ACCOUNT_NOT_APPROVED` mid-session (e.g. user was suspended), the axios interceptor invalidates `me` and redirects to `/account-status`.

### 9.1.1 Dashboard shell

- `DashboardLayout` built with the shadcn **Sidebar** component.
- Sidebar: app logo, nav items from `src/router/nav.ts` (each item has `label`, `icon`, `path`, `permission`); items are filtered with `hasPermission`, so each role sees only its pages. Admin's "Users" item shows the pending count badge (`GET /users/pending-count`).
- Behavior: `lg` and up → fixed sidebar, collapsible to icons (state remembered via the shadcn sidebar cookie); below `lg` → off-canvas Sheet opened from a menu button in the topbar.
- Topbar: menu button (mobile), breadcrumbs (from route `handle.crumb`), user menu (avatar initials, name, role badge, logout).
- Content area: `<Outlet />` in a padded container with a `PageHeader` (title, description, primary action guarded by `<Can>`).
- Route `ErrorBoundary` renders 403/404/errors inside the shell so navigation stays available.

### 9.1.2 Overview page

Stat cards from `GET /dashboard/stats` (different set per role) and a "Recent projects" list linking to details. Skeletons while loading.

### 9.2 Data layer

- `lib/api.ts`: axios instance with `baseURL: "/api"`, `withCredentials: true`, request interceptor attaching `Authorization: Bearer <accessToken>`, response interceptor for single-flight refresh.
- Vite dev server proxies `/api` → `http://localhost:4000`, so cookies are same-origin in development.
- Each feature has `api.ts` (typed functions) and `hooks.ts` (TanStack Query hooks).
- Query keys from a factory, e.g. `projectKeys.list(params)`, `projectKeys.detail(id)`.
- Lists use `placeholderData: keepPreviousData` for smooth pagination.
- Mutations invalidate affected keys (e.g. accepting a proposal invalidates project detail, project lists, and proposals).
- Errors shown with shadcn `Sonner` toasts using the API error message.

### 9.3 Projects browser (core screen)

- Toolbar: search input (debounced 300ms), Select dropdowns for status, category, type, a scope toggle (All / Mine) for owners and freelancers, and "Reset filters" (visible only when something is active).
- All state (q, status, category, type, scope, sort, order, page, limit) lives in **URL search params** so the view is shareable and survives refresh. Changing any filter resets page to 1.
- Desktop (md and up): shadcn Table with columns Title, Category, Type, Status, Owner, Freelancer ("Unassigned" if null), Price, Created, Deadline, Proposals.
- Sortable headers for Created and Price: click toggles desc → asc; arrow icon shows direction; `aria-sort` set; headers are buttons (keyboard accessible).
- Mobile (below md): cards with the key info and a Sort select (Newest, Oldest, Price high→low, Price low→high).
- Status as colored Badge (color map in shared constants or web constants).
- Price as USD currency; hourly shows "/hr".
- Deadline shows date + relative hint ("in 5 days"); "Overdue" in red for past deadlines on non-terminal projects.
- "Showing X–Y of Z projects", pagination controls (prev/next + page numbers on md+, prev/next only on mobile), page size select (10/20/50).
- Loading: skeleton rows/cards. Empty state: message + reset button. Error state: message + retry.

### 9.4 Forms

- React Hook Form + `zodResolver` with schemas imported from `@freelancehub/shared`.
- Project form: title, description, category, type, price, deadline (date picker), skills (tag input).
- Proposal form (on project details, freelancers only, project open, no existing proposal): cover letter, bid amount, estimated days.
- Server validation errors (`details`) mapped back to form fields.

### 9.5 Admin users page

Tabs or Select for status (default Pending, with a count badge in the nav), search by name/email, table on desktop / cards on mobile, Approve / Reject (dialog with optional reason) / Suspend actions with confirmation.

### 9.6 Responsive rules

Mobile-first with Tailwind breakpoints. Base styles target mobile; add `sm:`, `md:`, `lg:`, `xl:` modifiers progressively. Layout: dashboard shell per 9.1.1 (Sheet sidebar below `lg`, fixed collapsible sidebar on `lg+`). Content in a padded max-width container. Action buttons (create, edit, delete, status changes, proposal review) are rendered with `<Can>` / `allowedActions`, never by checking role names. Wide tables scroll inside their own `overflow-x-auto` wrapper; the page itself never scrolls horizontally.

---

## 10. Seed Data

`pnpm seed` (idempotent: clears collections, then inserts):

- 1 admin linked to `ADMIN_TELEGRAM_ID` (so the real admin can log in via Telegram).
- ~10 owners (startups, agencies, individuals, varied countries) and ~12 freelancers with varied titles. Most `approved`; 3 `pending`, 1 `rejected`, 1 `suspended` to populate the admin page. Seeded non-admin users get fake Telegram IDs/phones (they are data only and cannot log in).
- 40 projects with realistic titles (e.g. "Redesign SaaS Dashboard UI", "Technical SEO Audit for Online Store", "Next.js Landing Page with Headless CMS"), across all categories, types, and statuses.
- createdAt spread over the last 6 months; deadlines 1 week to 3 months after createdAt (some overdue).
- Prices: fixed-price $150–$15,000, hourly $15–$120.
- Consistency: `open`/`closed` projects have no freelancer; all other statuses (except some `cancelled`) have a freelancer and exactly one accepted proposal. Open projects get 0–6 pending proposals.

Use `@faker-js/faker` with a fixed seed for names, plus a hand-written list of project titles per category.

---

## 11. Security Checklist

- Server RBAC is the only security boundary. Client middleware and hidden buttons are UX; every endpoint must be safe even if called directly.
- Every protected route declares `requirePermission(...)`; a test fails if a route under `/api` (other than auth/health) is registered without it.
- Internal app: no public content; web `index.html` sets `<meta name="robots" content="noindex, nofollow">`.
- helmet, CORS restricted to `CLIENT_ORIGIN` with credentials.
- Rate limits: auth endpoints (e.g. 20 req / 15 min / IP), OTP verify additionally limited by session attempts.
- OTPs and refresh tokens stored only as hashes; constant-time comparison.
- Regex search input escaped; `limit` capped; sort fields whitelisted.
- Mongoose `strictQuery` on; never spread `req.body` into models (use parsed Zod output).
- No secrets in the client bundle; `.env` files git-ignored with `.env.example` committed.
- Env validated at startup with Zod; the process exits with a clear message if invalid.

---

## 12. Environment Variables

`apps/api/.env.example`

```
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/freelancehub?replicaSet=rs0
JWT_ACCESS_SECRET=change-me
JWT_ACCESS_EXPIRES_IN=15m
REGISTRATION_TOKEN_SECRET=change-me
REFRESH_TOKEN_TTL_DAYS=7
OTP_HASH_SECRET=change-me
OTP_TTL_SECONDS=120
AUTH_SESSION_TTL_MINUTES=10
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_PROXY_URL=
ADMIN_TELEGRAM_ID=
```

`apps/web/.env.example`

```
VITE_API_URL=/api
```

### Local MongoDB as a replica set

Transactions need a replica set. One-time setup:

1. Add to `mongod.conf`: `replication:\n  replSetName: rs0` (or start with `mongod --replSet rs0`).
2. Restart MongoDB, then run `mongosh --eval "rs.initiate()"`.
3. Use `?replicaSet=rs0` in `MONGODB_URI`.

### Telegram bot setup

Create a bot with @BotFather, put the token and username in `.env`, and set your own numeric Telegram ID as `ADMIN_TELEGRAM_ID` (get it from a bot like @userinfobot).

---

## 13. Testing

- API integration tests with Vitest + Supertest against `MongoMemoryReplSet`.
- Telegram notifier injected and replaced by a spy in tests; tests drive the auth flow by calling the bot handlers / session service directly.
- Must-have test coverage:
  - Projects list: each filter, search across title/owner/freelancer, both sorts in both directions, pagination meta, invalid params → 400.
  - RBAC: a table-driven test of each role against each protected endpoint (allowed vs 403), unit tests for every policy in `rbac/policies.ts`, a test that every role in `ROLE_PERMISSIONS` only references defined permissions, and pending/rejected/suspended users → `ACCOUNT_NOT_APPROVED`.
  - Web (light): unit tests for the route middleware functions (redirects and 403s) with Vitest.
  - Status transitions: every allowed transition succeeds, a sample of disallowed ones → 409.
  - Proposals: duplicate → 409, accept transaction (others rejected, project updated), double accept guarded.
  - Auth: OTP attempts lock, expired OTP, refresh rotation, refresh reuse revokes family, logout.
- Scripts: `pnpm test` (all), `pnpm --filter api test:watch`.

---

## 14. Delivery Phases

Each phase ends with `pnpm lint`, `pnpm typecheck`, `pnpm test` passing and a commit.

Priority: foundation first, then the identity path (sign-in → approval → dashboard), then dashboard features. Each phase is split into sub-tasks with a shared contract step followed by parallel API and Web tracks; the detailed checklist lives in [`TASKS.md`](./TASKS.md).

| Phase                           | Scope                                                                                                                                                                                                                                                                                                                                                                                                                      | Done when                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0. Foundation**               | pnpm workspaces, tsconfig base, ESLint/Prettier, `packages/shared` skeleton with constants **and the RBAC permission map**, API skeleton (env validation, DB connect, error handler, `/api/health`, pino), web skeleton (Vite, Tailwind v4, shadcn init incl. Sidebar, `createBrowserRouter` route tree with placeholder pages, DashboardLayout shell with static nav, query client, axios instance), root scripts             | `pnpm dev` runs both apps; `/dashboard` shows the responsive shell and a card that calls `/api/health`                                                                   |
| **1. Users + seed**             | User model, shared user schemas, seed v1 (admin + owners/freelancers in every status); web shell building blocks (PageHeader, EmptyState, ErrorState, route ErrorBoundary, breadcrumbs)                                                                                                                                                                                                                                   | `pnpm seed` fills the DB with users; an unknown URL shows 404 inside the shell                                                                                           |
| **2. Auth + RBAC**              | 2.1 guards and RBAC core (`authenticate`, `requireApproved`, `requirePermission`, policies skeleton, `/auth/me`; auth store, route **middleware**, `userContext`, `useCan`/`<Can>`, permission-filtered sidebar) → 2.2 Telegram sign-in (AuthSession, bot, OTP verify/resend; `/auth` stepper steps 1–2) → 2.3 registration and session lifecycle (register, refresh rotation, logout; step 3, interceptors, `/account-status`) | New user registers via Telegram and lands on the pending screen; returning user logs in; reload keeps the session; direct URL to a forbidden page shows 403 in the shell |
| **3. Admin approval**           | Users endpoints, pending-count badge, bot notifications, users page                                                                                                                                                                                                                                                                                                                                                        | Admin gets a Telegram message and approves the user, who then reaches `/dashboard`                                                                                       |
| **4. Projects data + browser**  | Project and Proposal models, shared project schemas, seed v2 (projects + proposals); `GET /projects` aggregation + tests; toolbar, table, cards, pagination, URL sync, responsive                                                                                                                                                                                                                                          | All search/filter/sort/pagination work on mobile and desktop                                                                                                             |
| **5. Project CRUD + status**    | create/edit/delete, details page with `allowedActions`, status transition endpoint + UI, policies + tests                                                                                                                                                                                                                                                                                                                  | RBAC, ownership, and transition rules enforced and tested                                                                                                                |
| **6. Proposals**                | submit/withdraw/list/accept/reject, my proposals page, notifications                                                                                                                                                                                                                                                                                                                                                       | Full hire flow works end to end                                                                                                                                          |
| **7. Overview**                 | `GET /dashboard/stats`, overview page per role                                                                                                                                                                                                                                                                                                                                                                             | Each role sees its own stats                                                                                                                                             |
| **8. Polish**                   | accessibility pass, empty/error states, README with setup and architecture                                                                                                                                                                                                                                                                                                                                                 | Fresh clone + README steps → running app                                                                                                                                 |
