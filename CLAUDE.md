# CLAUDE.md

FreelanceHub: an **internal company dashboard** (fullstack TypeScript monorepo) where owners post freelance projects, freelancers submit proposals, and an admin approves members. Auth is Telegram-OTP only (no passwords). Everything except `/auth` and `/account-status` lives inside the authenticated dashboard shell. The full spec is in `docs/PRD.md` — read the relevant section before starting any task.

This is course content for a Claude Code course: code must be clean, consistent, and easy for students to read.

## Stack
- pnpm workspaces: `apps/server`, `apps/client`, `packages/shared` (imported as `@freelancehub/shared`)
- API: Node 22, Express 5, Mongoose 8, Zod, grammY (Telegram bot), jsonwebtoken, pino
- Web: Vite, React 19, React Router ≥ 7.9 (data mode + route middleware), shadcn Sidebar for the shell, TanStack Query v5, axios, React Hook Form, Tailwind CSS v4, shadcn/ui
- DB: local MongoDB as single-node replica set `rs0` (transactions are used)
- Tests: Vitest + Supertest + mongodb-memory-server (`MongoMemoryReplSet`)

## Commands
- `pnpm install` — install all workspaces
- `pnpm dev` — run api (4000) and web (5173) in parallel
- `pnpm --filter server dev` / `pnpm --filter client dev` — run one app
- `pnpm seed` — reset and seed the database
- `pnpm lint` / `pnpm format` / `pnpm typecheck` / `pnpm test`
- `pnpm dlx shadcn@latest add <component>` — run inside `apps/client`

## Architecture rules
- Shared first: enums, Zod schemas, the project status transition map, and API response types live in `packages/shared`. Never duplicate them in an app.
- API modules follow `routes → controller → service → model`. Controllers stay thin (parse validated input, call service, send response). Business rules and ownership checks live in services.
- Every route validates body/params/query with a shared Zod schema via `validate()`. Use the parsed output, never raw `req.body`.
- Response envelope: `{ data, meta? }` for success, `{ error: { code, message, details? } }` for errors. Throw `AppError` with a code; the central error handler formats it.
- Authorization is permission-based RBAC. The permission list, `ROLE_PERMISSIONS`, and `hasPermission()` live in `packages/shared/src/rbac`. Never check role names (`role === 'admin'`) in routes, services, or UI; check permissions.
- Server (the real security boundary): every protected route uses `authenticate → requireApproved → requirePermission(...) → validate(...)`. Scoped permissions (`:own`, `:assigned`, `:project`) are completed by pure policy functions in `apps/server/src/rbac/policies.ts`, called from services. Never trust role or ownership info from the client.
- Client (UX only): guards are React Router route **middleware** in `src/router/middleware.ts` (`authMiddleware`, `approvedMiddleware`, `requirePermission(...)`, `guestMiddleware`, `statusPageMiddleware`), declared on parent routes and inherited by children. No guard wrapper components. Middleware puts the user in `userContext`; loaders read it with `context.get(userContext)` and prefetch with `queryClient.ensureQueryData`.
- UI actions are shown with `useCan` / `<Can>` or the `allowedActions` returned by the API. Sidebar items are filtered by permission from `src/router/nav.ts`.
- 403 and 404 render inside the dashboard shell via the route ErrorBoundary.
- Search, filter, sort, and pagination happen on the server (aggregation pipeline in `projects/query-builder.ts`). The web app never filters or sorts lists locally.
- The web app has no mock or local data. All data comes from the API.
- Access token lives in memory only (auth store). Never use localStorage/sessionStorage for tokens. Refresh token is an httpOnly cookie handled by the server.
- Web features are organized in `src/features/<feature>/` with `api.ts`, `hooks.ts`, and components. Use a query key factory per feature.
- List page state (filters, sort, page) lives in URL search params.
- Telegram calls go through a notifier service that can be injected/mocked; a Telegram failure must never fail an API request.

## Code style
- TypeScript strict. No `any`; use `unknown` and narrow. Prefer types inferred from Zod schemas.
- Named exports (except where a tool requires default). Files: `kebab-case.ts`, React components `PascalCase.tsx`.
- Components small and focused (aim for under ~150 lines); extract hooks for logic.
- Tailwind mobile-first: base classes for mobile, then `sm:`/`md:`/`lg:`/`xl:`. No desktop-first overrides.
- Accessible UI: labeled inputs, buttons for clickable headers, `aria-sort` on sorted columns.
- English only, LTR. No commented-out code; comments explain "why", not "what".

## Workflow
- Work one PRD phase (section 14) at a time. Do not start the next phase unless asked.
- Before writing code for a task: read the relevant PRD sections, then present a short plan (files to create/change, key decisions) and wait for my approval.
- Install packages with `pnpm add` in the correct workspace (`--filter`). Don't add libraries outside the PRD stack without asking.
- After changes run `pnpm lint`, `pnpm typecheck`, and relevant tests; fix failures before saying a task is done.
- Write or update API tests for any endpoint you add or change.
- Never edit `.env` files; update `.env.example` when adding a variable, and add it to the Zod env schema.
- Commits: Conventional Commits (`feat(api): ...`, `fix(web): ...`, `chore: ...`), one logical change per commit. Don't push.
- If the PRD is unclear or conflicts with the code, stop and ask instead of guessing.