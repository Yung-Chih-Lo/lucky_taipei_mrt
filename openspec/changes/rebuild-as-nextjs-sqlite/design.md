## Context

The current app is a Vite SPA with client-only state: `metroData.json` is bundled into the JS, admin edits live in `localStorage`, and the admin password is inlined from `VITE_PASSWORD` at build time. The map is rendered via Leaflet against real lat/lng, even though the source JSON was designed around schematic coordinates (`center.x/y`, `size.width/height`, `name.pos.x/y/anchor`). Deployment is Zeabur caddy-static.

Three root issues follow from the "no backend" stance: credentials leak into the bundle, admin edits never reach other visitors, and the richer schematic data model sits unused. Rather than patch these in isolation, we are replacing the runtime shell with Next.js so that:

- A server exists to hold the session cookie and the admin password hash.
- A database exists as the single source of truth for station data.
- The display layer can abandon Leaflet for a purpose-built SVG schematic renderer.

The app remains small: one admin (the owner), a few hundred stations, single-region deployment, no multi-tenant concerns. Designs should reflect that — no user table, no multi-writer coordination, no job queues.

## Goals / Non-Goals

**Goals:**
- Move the admin password out of the client bundle; enforce auth server-side on every admin route and mutation.
- Make admin edits globally visible on save, no redeploy.
- Render the map from schematic coordinates (`schematic_x/y`) with independently positioned labels, matching the look of real MRT schematic maps.
- Let the admin drag both station and label handles, and switch label anchor.
- Keep deployment on Zeabur with a persistent SQLite file on a mounted volume.
- Preserve `lat/lng` as unused-but-available metadata for future geographic features.

**Non-Goals:**
- Multi-user accounts, registration, password reset, or role hierarchy.
- Per-station SEO-optimized public pages. (Deferred; the app remains a single-screen picker.)
- Automatic schematic layout generation. Admin positions stations manually.
- Editing connections (line segments), line colours, or a station's line membership via UI. Any of those still require a DB migration / seed edit for this iteration.
- Server-side rate limiting, audit log, or multi-device session management.
- Migrating existing per-browser `localStorage` overrides — current overrides are private to each admin browser and have no production value.

## Decisions

### D1. Next.js App Router, not Pages Router
App Router is the current Next.js default, has first-class server components for the public read-path (cheap, cache-friendly), and a clean place for route-level `middleware.ts` auth. Pages Router would work but is the legacy stack.

_Alternatives considered:_ Remix (good DX, smaller ecosystem for Zeabur); plain Express + React (too much glue to rebuild).

### D2. SQLite via `better-sqlite3` + Drizzle ORM
`better-sqlite3` gives synchronous, single-process SQLite access — perfect for a single-node Next.js server on Zeabur. Drizzle adds typed queries and migrations without the weight of Prisma's generated client or a separate engine binary.

_Alternatives considered:_ Prisma (heavier, codegen step, worse DX for SQLite); raw `better-sqlite3` with hand-written SQL (fine but typed Drizzle is cheap insurance as schema evolves); Turso / libSQL (good portability story but adds a network hop and a second vendor — Zeabur volume is simpler for one admin).

### D3. Auth: env credentials + `iron-session`, no user table
One admin, set by env vars `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (argon2id hash). Login hits `POST /api/auth/login`, which verifies with argon2 and sets a signed, encrypted `iron-session` cookie (`httpOnly`, `secure`, `sameSite=lax`). Middleware at the edge of `/admin/*` and all mutating `/api/admin/*` routes reads the cookie and 401s / redirects if absent.

_Alternatives considered:_ NextAuth with Credentials provider (overkill for one user, drags in OAuth-shaped abstractions); DB-backed users (buys nothing at N=1); JWT in localStorage (vulnerable to XSS, worse than httpOnly cookie).

### D4. SVG schematic renderer, no Leaflet
The public map and the admin editor share one SVG component. Input: `canvas_config {width, height}` and station + label data. Output: an `<svg viewBox="0 0 W H">` with one `<circle>` per station, one `<text>` per label, and `<line>`/`<path>` segments for connections. The lottery "train" animation is re-implemented as an animated `<g>` that tweens along pre-computed station positions.

_Alternatives considered:_ HTML Canvas (worse for accessibility, harder admin hit-testing); keep Leaflet with `CRS.Simple` and abstract coords (inherits pan/zoom baggage we don't need); a library like `d3` (only small SVG needed, not worth the dep).

### D5. Admin editing model: two independent handles per station
Each station in admin mode renders with two drag handles in the same SVG:
```
       ┌── drag body = move (schematic_x, schematic_y)
       ▼
       ●───── 忠孝敦化  ◀── drag label = move (label_x, label_y)
                         hover shows [◀ ▮ ▶] to flip label_anchor
```
Both handles save on drop via `PATCH /api/admin/stations/:id`. The anchor switcher is a small popover that writes `label_anchor ∈ {start, middle, end}`.

Snap-to-grid and 45°/90° constraints are deferred to a later iteration; freeform drag ships first.

### D6. Data flow: server components for reads, Route Handlers for writes
Public page (`app/page.tsx`) is a React Server Component that queries Drizzle directly — no `/api/stations` GET needed, no client-side fetch on first paint. The picker's "roll" interaction runs client-side with data hydrated from the server component. Mutations go through `app/api/admin/*` route handlers, each re-checking the session cookie before writing.

_Alternatives considered:_ REST API for reads too (needed extra hop for no benefit); Server Actions (fine, but explicit route handlers are more obvious for admin mutations and easier to rate-limit later).

### D7. Schema layout
```
stations
  id                  INTEGER PK
  name_zh             TEXT NOT NULL UNIQUE
  name_en             TEXT
  lat                 REAL                -- nullable; reference-only
  lng                 REAL                -- nullable; reference-only
  schematic_x         REAL NOT NULL
  schematic_y         REAL NOT NULL
  label_x             REAL NOT NULL
  label_y             REAL NOT NULL
  label_anchor        TEXT NOT NULL CHECK (label_anchor IN ('start','middle','end'))
  updated_at          INTEGER NOT NULL    -- unix ms

lines
  code                TEXT PK             -- 'BL', 'R', 'BR', ...
  name_zh             TEXT
  name_en             TEXT
  color               TEXT NOT NULL

station_lines
  station_id          INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE
  line_code           TEXT NOT NULL REFERENCES lines(code)
  PRIMARY KEY (station_id, line_code)

connections
  id                  INTEGER PK
  from_station_id     INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE
  to_station_id       INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE
  line_code           TEXT NOT NULL REFERENCES lines(code)
  path_json           TEXT NOT NULL    -- SVG path points: [{command:'M'|'L'|'Q', coordinates:[x,y,...]}, ...]

canvas_config
  id                  INTEGER PK CHECK (id = 1)   -- singleton row
  width               INTEGER NOT NULL
  height              INTEGER NOT NULL
```
Rationale: `stations.name_zh` is unique because current data uses it as a natural key (e.g. in `stationId`). `label_anchor` constrained to the three SVG values the renderer understands. `connections.path_json` preserves the existing JSON's intermediate path points (M/L/Q commands) so that curved/bent line segments in the Taipei MRT schematic render correctly; the renderer reconstructs `<path d="…"/>` from the stored points. `connections` stored bidirectionally is unnecessary — render logic draws each row as a single path regardless of direction.

### D8. Seeding strategy: one-time script, JSON leaves runtime
`scripts/seed.ts` reads the current `src/data/metroData.json`, opens Drizzle, and populates all five tables in a transaction. It is idempotent via `INSERT OR IGNORE` on the natural keys so re-running on an already-seeded DB is safe. After first successful production seed, `metroData.json` is removed from the app source tree (git history still contains it).

_Alternatives considered:_ Fixture auto-seed at startup if DB empty (couples deploy to data; harder to predict); keep JSON as fallback source of truth (two sources of truth is the original sin we're trying to fix).

### D9. Deployment: Zeabur with `/data` volume
`zbpack.json` updated to Next.js build. A Zeabur persistent volume is mounted at `/data`. `DATABASE_PATH=/data/metro.db`. Seed runs as a one-off command (`npm run seed`) from Zeabur's console on first deploy. Subsequent deploys leave the DB untouched.

## Risks / Trade-offs

- **Single SQLite file on one replica** → mitigation: Zeabur service configured as single-replica. If we ever need horizontal scale, migrate to Postgres or Turso; the Drizzle schema is ~portable.
- **Volume backup is manual** → mitigation: admin export endpoint dumps current DB to JSON for offline backup; document running `openspec`-style export periodically. (Export endpoint is in scope; automatic scheduled backup is not.)
- **Argon2 native binary on Zeabur build** → mitigation: use `@node-rs/argon2` (prebuilt binaries) and pin Node 20 LTS in `zbpack.json` (already set).
- **Admin edits are synchronous and un-audited** → mitigation: single admin means concurrent edits are unlikely; `updated_at` timestamp gives basic last-write-wins visibility. Out of scope to add an audit log now.
- **Accidentally deploying without seeding** → mitigation: the public page guards against empty results and renders an "DB not seeded" state with console guidance, instead of a blank canvas.
- **HashRouter URLs (`/#/admin`) in existing bookmarks break** → acceptable. Traffic is minimal; the main route `/` is unchanged.
- **`sessionStorage.admin_auth` in old sessions is meaningless in the new app** → no mitigation needed; nothing in the new code reads it.

## Migration Plan

1. **Build the new app alongside the old** in the same repo. Create `app/`, `lib/`, `db/`, `scripts/`, `drizzle/` at the repo root. Keep `src/` untouched until Phase 6.
2. **Land schema + seed + server-rendered public page** (no admin yet). Verify parity with current public UX locally against a seeded local SQLite.
3. **Land auth + admin shell** behind `/admin`. Verify unauthenticated access is blocked by middleware.
4. **Land station + label editor**; all mutations go through `/api/admin/stations/:id`.
5. **Cut Zeabur deploy** to the new build: change `zbpack.json`, attach volume at `/data`, set env vars, run seed once. Confirm the site serves as before.
6. **Delete old Vite stack**: remove `src/`, `vite.config.js`, `index.html`, `public/_redirects`, `public/train.png`'s old usage, plus Vite / React Router / Leaflet deps from `package.json`.

**Rollback:** Phases 1–5 are additive; if Phase 5 fails the deploy, Zeabur rolls back to the previous commit, which still contains the working Vite SPA. Only after a successful Phase 5 do we commit Phase 6's deletions.

## Implementation Notes

- **Middleware file location:** Next.js 15 treats the presence of `src/` as the source root, and looks for `middleware.ts` at `src/middleware.ts` rather than the repo root. During the transition period where both the old Vite `src/` tree and the new Next.js `app/` tree coexist, `middleware.ts` must live at `src/middleware.ts`. Move it back to the repo root in Phase 7 once `src/` is deleted.
- **Edge runtime in middleware:** The middleware imports must be edge-safe. That means the SessionData type and cookie name are exported from `lib/session-shared.ts` (no `server-only` import, no Node APIs); `lib/session.ts` with the full `getIronSession` helper imports `server-only` and is reserved for route handlers.

## Open Questions

- Does Zeabur's Next.js builder handle native modules (`better-sqlite3`, `@node-rs/argon2`) without extra config, or do we need a custom build command? Decide after first real build attempt; fallback is switching to `@libsql/client` (pure JS).
- Do we want to add a "dirty indicator" in the admin UI (changes pending save) vs. auto-save on drop? This spec assumes auto-save on drop for simplicity; revisit if it feels flaky in practice.
- Do we need CSRF protection on `/api/admin/*` beyond `sameSite=lax` cookies? For a single-admin, non-banking app, `sameSite` is likely sufficient — but document the assumption explicitly.
