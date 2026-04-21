## Why

The current Vite SPA has three linked problems that all point to the same root cause — no backend:

1. **Admin credentials are shipped in the client bundle.** `VITE_PASSWORD` is inlined at build time, so anyone can read it from the deployed JS. Even without the password, an attacker can bypass the login by setting `sessionStorage.admin_auth` in devtools.
2. **Admin edits only affect the admin's own browser.** Data lives in `localStorage`; publishing changes requires exporting JSON, committing to the repo, and redeploying.
3. **The map renders from geographic lat/lng even though the JSON already carries schematic `center.x/y` and `name.pos.x/y/anchor` coordinates.** The pretty, MRT-style relative layout the data was designed for has never been used.

Rebuilding as a Next.js app with a SQLite-backed admin closes all three gaps at once: real server-side auth, shared persisted data, and room to ditch Leaflet for a proper SVG schematic renderer that uses the coordinates already in the data.

## What Changes

- **BREAKING**: Replace Vite + React Router SPA with Next.js App Router. Client bundle no longer contains any admin secret.
- **BREAKING**: Replace Leaflet geographic map with a pure SVG schematic renderer that reads `schematic_x/y` (station) and `label_x/y/anchor` (label) from the database. `lat`/`lng` are retained in the schema as metadata for future features but are not used for display.
- **BREAKING**: Replace `localStorage` data override with SQLite as the single source of truth for station data. All visitors see the same data; admin edits are published on save.
- Add single-admin authentication: username + argon2 password hash in environment variables, `iron-session` httpOnly cookie, Next.js middleware guarding `/admin/*`. No user table, no registration.
- Extend the admin editor to drag station position **and** drag label position independently, plus switch label anchor (`start` / `middle` / `end`) via a small hover control.
- Remove the lottery picker's dependency on `localStorage` / bundled JSON — it queries the DB via a server component.
- Add a one-time seed script that imports the existing `metroData.json` into SQLite; JSON file is then removed from runtime code paths (kept in git history for reference).
- Deployment target stays Zeabur. SQLite file lives on a mounted persistent volume.

## Capabilities

### New Capabilities
- `admin-auth`: Single-admin login using env-configured credentials, `iron-session` cookie, and route middleware protecting `/admin/*`.
- `metro-data-layer`: SQLite schema for stations, lines, connections, and canvas config; Drizzle ORM access; one-time seed from `metroData.json`.
- `schematic-rendering`: Pure SVG renderer that draws the metro map from schematic coordinates, including the lottery train animation previously handled by Leaflet.
- `station-editor`: Admin UI for dragging station position, dragging label position, and changing label anchor, persisting each change to the database.

### Modified Capabilities
_None — no existing OpenSpec specs in this repo yet; this change establishes the initial spec set._

## Impact

- **Code**: Entire `src/` tree replaced. `pages/MainPage.jsx`, `pages/AdminPage.jsx`, `components/LeafletMap.jsx`, `utils/metroDataLoader.js`, `utils/metroUtils.js`, `data/metroData.json`, `constants/metroInfo.js` either move to the Next.js app with heavy rewrites or are removed outright.
- **Dependencies**: Add `next`, `react` (already present), `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `iron-session`, `argon2` (or `@node-rs/argon2`). Remove `vite`, `@vitejs/plugin-react-swc`, `react-router-dom`, `leaflet`, `react-leaflet`, `@types/leaflet`.
- **Build & deploy**: `vite.config.js`, `zbpack.json`, `index.html`, `public/_redirects` are removed or replaced. `zbpack.json` adjusted for Next.js build. Zeabur service gets a persistent volume mount (e.g. `/data`) containing `metro.db`.
- **Environment variables**: `VITE_PASSWORD` removed. New vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `DATABASE_PATH`.
- **URLs**: `/admin` now works as a real route (no `HashRouter`). Public URL shape unchanged for visitors.
- **Data migration**: One-time seed from existing JSON; no production data to preserve since current admin edits only live in individual browsers' `localStorage`.
