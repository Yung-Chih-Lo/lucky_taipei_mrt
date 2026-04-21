## 1. Project skeleton (Next.js alongside Vite)

- [x] 1.1 Add Next.js, React, `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `iron-session`, `@node-rs/argon2`, `zod` to `package.json`; keep Vite deps for now
- [x] 1.2 Add Next.js scripts to `package.json` (`dev:next`, `build:next`, `start`) without removing existing Vite scripts yet
- [x] 1.3 Create `next.config.mjs`, `tsconfig.json` (if adopting TS for new code), and `.gitignore` entries for `.next/` and `data/`
- [x] 1.4 Create `app/` directory with a minimal `layout.tsx` and placeholder `page.tsx` so `npm run dev:next` boots
- [x] 1.5 Add `antd` ConfigProvider + styled-components SSR bridge in the root layout (public map is server-rendered; interactive pieces stay client-side) — used `@ant-design/nextjs-registry`; dropped styled-components in favour of inline/CSS styles to avoid a second SSR bridge

## 2. Data layer (metro-data-layer)

- [x] 2.1 Create `db/schema.ts` defining Drizzle tables: `stations`, `lines`, `station_lines`, `connections`, `canvas_config` per design D7 — added `connections.path_json` (design D7 updated)
- [x] 2.2 Configure `drizzle.config.ts` for SQLite + `better-sqlite3` driver
- [x] 2.3 Add `db/client.ts` exporting a singleton Drizzle instance that reads `DATABASE_PATH` and fails fast if unset
- [x] 2.4 Generate initial migration via `drizzle-kit generate` and commit `drizzle/` SQL files — `drizzle/0000_initial.sql`
- [x] 2.5 Add `npm run migrate` that applies pending migrations to the configured DB
- [x] 2.6 Write `scripts/seed.ts`: reads `src/data/metroData.json`, inserts into all five tables inside a transaction, idempotent via `INSERT OR IGNORE` on natural keys, populates `canvas_config` from JSON `size`
- [x] 2.7 Add `npm run seed`; verify locally that a fresh `./data/metro.db` ends up fully populated — 118 stations / 135 station_lines / 129 connections
- [x] 2.8 Add unit tests for seed idempotency — standalone `scripts/test-seed-idempotency.ts` (no framework dep); run via `npm run test:seed`
- [x] 2.9 Add `db/queries.ts` with typed helpers: `getAllStationsWithLines()`, `getConnections()`, `getCanvasConfig()`, `getLinesMap()`

## 3. Public rendering (schematic-rendering)

- [x] 3.1 Create `components/SchematicMap.tsx` (client component): accepts `{ stations, connections, lines, canvas, selectedLineCodes?, onStationClick?, ...adminHandlers }` and renders SVG with `viewBox="0 0 W H"` and `preserveAspectRatio="xMidYMid meet"` — admin handler props deferred to Phase 5
- [x] 3.2 Implement connection segments — used `<path>` with `d` built from stored `path_json` so curved/bent lines preserve their shape
- [x] 3.3 Implement station marks: `<circle>` at `(schematic_x, schematic_y)`, radius varies by line count (1 line vs interchange)
- [x] 3.4 Implement labels: `<text>` at `(label_x, label_y)` with `text-anchor` from `label_anchor`
- [x] 3.5 Implement line-filter dimming: reduce opacity of segments/stations not in `selectedLineCodes` when filter is active
- [x] 3.6 Port lottery animation: `useEffect` walks the supplied `animationStations` sequence at ~180ms cadence, moves a marker `<g>`, fires `onAnimationEnd` after the last hop
- [x] 3.7 Ensure the animation handles re-triggering mid-animation without stray markers — cleanup on effect re-run + unmount
- [x] 3.8 Add `app/page.tsx` (server component): Drizzle-query the data, pass to `<HomeClient>` wrapper
- [x] 3.9 Port `Sidebar` component and lottery trigger logic (client component) using ported `pickRandomStation` util in `lib/randomStation.ts`
- [x] 3.10 Port `ResultDisplay` modal
- [x] 3.11 Smoke-test: `curl localhost:3100/` returns 200 with SVG fully server-rendered (first path `M 503 464 L 503 526` brown, first circle at (476,878) green, first label at (462,878) anchor=end — all match the source JSON)

## 4. Auth (admin-auth)

- [x] 4.1 Add `lib/session.ts`: `iron-session` config reading `SESSION_SECRET`, cookie options (`httpOnly`, `secure` in prod, `sameSite=lax`, 7-day expiry) — plus `lib/session-shared.ts` for middleware-safe exports (cookie name + SessionData type; avoids `server-only` tainting middleware)
- [x] 4.2 Add `lib/auth.ts`: helper to verify `(username, password)` against `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` using `@node-rs/argon2`
- [x] 4.3 Add `app/api/auth/login/route.ts`: zod-validated body, credential check, 401 on failure with generic message, 400 on malformed body, 200 + session cookie on success
- [x] 4.4 Add `app/api/auth/logout/route.ts`: clears session; 200 regardless of prior state
- [x] 4.5 Add `middleware.ts` — placed in `src/middleware.ts` (not repo root) because Next.js 15 treats any pre-existing `src/` tree as the source root and looks for middleware there. Match `/admin/*` + `/api/admin/*`, redirect unauthed `/admin/*` to `/admin/login?from=...`, return 401 JSON for unauthed `/api/admin/*`. Will move back to repo root in Phase 7 after `src/` is deleted.
- [x] 4.6 Add `app/admin/login/page.tsx`: login form posting to `/api/auth/login`, handles 401 error display, redirects to `?from=` or `/admin` on success
- [x] 4.7 `scripts/hash-password.ts` — run `npm run hash-password -- '<password>'` to print an argon2id hash for `ADMIN_PASSWORD_HASH`
- [x] 4.8 End-to-end test (12 curl cases, all pass): unauth `/admin` → 307 redirect to `/admin/login?from=%2Fadmin`; unauth `/api/admin/*` → 401 JSON; `/admin/login` public; wrong pw → 401; malformed body → 400; missing fields → 400; correct login → 200 + httpOnly cookie; `/admin` with cookie → 200; `/api/admin/*` with cookie → passes through; bogus cookie → 307 redirect; logout → 200; `/admin` after logout → 307 redirect

## 5. Admin editor (station-editor)

- [x] 5.1 `app/admin/layout.tsx` — pass-through (logout lives in the admin page toolbar, not the layout, so the login page is not tainted)
- [x] 5.2 `app/admin/page.tsx` — server component that hands data to `<AdminClient>`
- [x] 5.3 Station drag in SchematicMap — `onPointerDown` captures start SVG coords via `getScreenCTM().inverse()`; window-level `pointermove`/`pointerup` update `liveOffset`; label visually tracks station by the same delta
- [x] 5.4 On drop, AdminClient calls `PATCH /api/admin/stations/:id` with `{schematicX, schematicY, labelX, labelY}`; reverts local position on non-200 and toasts
- [x] 5.5 Label drag is an independent pointer capture scoped to the `<text>` element; drop fires `PATCH {labelX, labelY}` only
- [x] 5.6 Anchor switcher — click (not hover) on label opens a fixed-position popover `[◀ 靠左 ◆ 置中 靠右 ▶]`; selection fires `PATCH {labelAnchor}`; backdrop closes without applying. Popover positioned via `data-label-id` attribute + `getBoundingClientRect`
- [x] 5.7 Empty-canvas click — background `<rect>` in admin mode captures pointerdown; if movement is < click threshold, opens add modal with SVG-space coords
- [x] 5.8 Add modal — `nameZh` required, `nameEn` optional, line checkboxes; `POST /api/admin/stations`; 409 duplicate surfaces as toast
- [x] 5.9 Edit modal — name fields + line memberships + Delete; `PATCH` / `DELETE`
- [x] 5.10 `app/api/admin/stations/route.ts` (POST) and `app/api/admin/stations/[id]/route.ts` (PATCH, DELETE) — each re-verifies session via `getSession`, zod-validates, updates `updatedAt`, returns updated row with `lineCodes` or 404
- [x] 5.11 `app/api/admin/export/route.ts` — single-transaction dump of all 5 tables as downloadable JSON
- [x] 5.12 Click-vs-drag distinguisher — < 4px screen movement AND < 250ms elapsed counts as click; otherwise drag
- [x] 5.13 End-to-end test (12 API cases, all pass): admin page SSR (200, 118 station circles, toolbar, hint bar, logout button); POST create 200; duplicate nameZh → 409; PATCH position 200; PATCH labelAnchor accepted; invalid anchor → 400; unauth PATCH → 401; DELETE 200; export dump 200 (118/8/129 counts); unauth export → 401; public `/` unaffected. Browser-only interactions (actual drag/drop, modal open/close) are covered in the rendered HTML but not asserted — needs manual check in a real browser.

## 6. Deployment (Zeabur volume)

- [x] 6.1 Docker-based deploy instead of zbpack/Node builder. Removed `zbpack.json`. Added multi-stage `Dockerfile` (deps → builder → runner on `node:20-slim`), `docker-entrypoint.sh` (mkdir volume dir → migrate → idempotent seed → `next start`), and `.dockerignore` (excludes legacy `src/*` but keeps `src/middleware.ts` because Next 15 still treats src/ as source root when it exists). Also set `pageExtensions: ['tsx', 'ts']` in `next.config.mjs`. Seed JSON moved to `scripts/seed-data/metroData.json` so it survives Phase 7's deletion of `src/`. Moved `drizzle-kit` + `tsx` to `dependencies` so the entrypoint can run them from the pruned production `node_modules`.
- [ ] 6.2 Attach Zeabur persistent volume, mount at `/data` (**USER ACTION**)
- [ ] 6.3 Set Zeabur env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (from `npm run hash-password`), `SESSION_SECRET` (≥32 chars). `DATABASE_PATH` and `NODE_ENV` are defaulted in the Dockerfile (`/data/metro.db` / `production`) but can be overridden. `PORT` set by Zeabur automatically. (**USER ACTION**)
- [ ] 6.4 `git push` → Zeabur auto-detects `Dockerfile` → builds → starts container. Entrypoint runs migrate + seed automatically on every boot; both are idempotent so the mounted volume's existing data is preserved across rebuilds. (**USER ACTION — just push**)
- [ ] 6.5 Verify production: `/` renders from DB, `/admin` redirects to login when logged out, login + drag + logout work, public visitor sees admin's change without redeploy (**USER VERIFY**)
- [x] 6.6 Native modules verified locally via `npm run build`: 8 routes generated, middleware 37.3 KB, `better-sqlite3` + `@node-rs/argon2` compile cleanly. Dockerfile's `deps` stage installs `python3 make g++` so the same compilation works inside the container for platforms where prebuilt binaries aren't shipped.

## 7. Remove the old Vite stack (only after Phase 6 is green)

- [ ] 7.1 Move `src/middleware.ts` to repo-root `middleware.ts`, fix its import of `session-shared` back to `@/lib/session-shared`, then delete `src/`, `index.html`, `vite.config.js`, `eslint.config.js` (recreate ESLint config for Next.js if desired), `public/_redirects`
- [ ] 7.2 Remove `vite`, `@vitejs/plugin-react-swc`, `react-router-dom`, `leaflet`, `react-leaflet`, `@types/leaflet` from `package.json`
- [ ] 7.3 Remove old Vite scripts (`dev`, `build`, `preview`) and the old `homepage` field if no longer applicable; make `dev`/`build` the Next.js variants
- [ ] 7.4 Move `scripts/seed.ts`' JSON source path: either keep the JSON in `scripts/seed-data/metroData.json` for future re-seeds, or document that re-seeding requires restoring the file from git history
- [ ] 7.5 Update `README.md` with the new dev flow (`npm run migrate`, `npm run seed`, `npm run dev`)
- [ ] 7.6 Commit final deletion as a separate commit so rollback to the old stack remains a single revert
