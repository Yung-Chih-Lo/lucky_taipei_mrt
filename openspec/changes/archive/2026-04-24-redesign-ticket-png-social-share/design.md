## Context

The PNG at `/api/ticket/[token]` is rendered by Next.js `ImageResponse` (`next/og`) — a Satori-based renderer with a narrow subset of CSS. Any layout decision must survive Satori's limitations: no `writing-mode`, no `grid`, flex only, `display: flex` required on every element that has children with text siblings, no CSS custom properties at runtime, no `gap` on some older versions (we verified current code uses `gap` successfully). The route already loads three subset fonts from `public/fonts/` (Noto Serif TC 900, Noto Sans TC 500, JetBrains Mono 500) and calls `qrcode.toString(..., { type: 'svg' })` to embed an SVG QR as a data URI.

The new design must match a fixed UX mock (Image #11). The redesign is purely visual/data-binding — no new runtime dependencies, no new DB tables, one new data join (first line per MRT station). Blast radius stays inside this one route plus one deleted page and one deleted component.

The surrounding flow is unchanged: `ShareableTicket` fetches this same URL, and on desktop writes the PNG to the clipboard, on touch calls `navigator.share({ files: [file] })`. The QR target inside the PNG is deliberately the site root, not a per-token comment URL, because the PNG is a recruitment asset for friends, not a returnable receipt for the owner.

## Goals / Non-Goals

**Goals:**
- PNG renders to match the UX mock pixel-intent: left vertical 籤號 band, huge Chinese station name, line/county chip, right-column QR + `此站有緣` stamp, bottom-row meta.
- All label copy matches the mock verbatim (`同行 · SCAN`, `此站有緣`, `命中注定 · 做到哪就去哪`, `坐火行 · 命籤 第 ○○○ 號`).
- Redesign remains a pure Satori layout — no new runtime dependencies, no canvas rasterization.
- Deterministic output: same token renders to the same bytes (existing `immutable` cache header keeps working).
- Readable on a 320px-wide Line preview thumbnail (station name and `此站有緣` stamp must still be recognizable at small scale).

**Non-Goals:**
- Owner-facing HTML page (`/ticket/[token]/page.tsx`) is being removed, not re-skinned. This change does not introduce a new HTML surface to replace it.
- Reveal modal's QR target is not touched; only the PNG route's QR is in scope.
- No responsive / mobile-specific PNG variant. One canvas serves all platforms.
- No i18n — copy is fixed Traditional Chinese per brand identity.
- No change to `station_picks.id → ticket No.` derivation. Same `String(id).padStart(4, '0')` pipeline.

## Decisions

### Decision 1: 2160×1214 landscape (2× the logical 1080×607)

Logical design is 1080×607 (~16:9), but the output PNG is rendered at `2160×1214` to stay sharp on retina/3× phone displays and when zoomed in on desktop previews. All style dimensions are multiplied by a `S = 2` constant so the layout ratios are identical to the 1× design — only the pixel density changes. File size roughly 2.3× (52 KB → 120 KB) is acceptable for the growth-asset use case. The stale spec text that says 1080×1920 is corrected via the delta.

**Alternatives considered:**
- 1200×630 (Twitter Card / OG standard) → marginally better for Twitter embeds, but an arbitrary break with existing fetches and cache keys for no meaningful gain in the primary sharing channels (Line / IG DM).
- 1080×1920 (IG Story portrait) → wrong aspect for the ticket metaphor; wastes space above/below the ticket and forces either tiny type or letterboxing.

### Decision 2: Vertical 籤號 band via character-per-`<div>` stack

Satori does not support `writing-mode: vertical-rl`. Each character of `坐 火 行 · 命 籤 第 <digits> 號` is rendered as its own `<div>` inside a flex-column wrapper pinned to the left edge. Characters are stacked top-to-bottom, spacing via `marginBottom` or flex `gap`. No rotation transforms — Satori supports `transform: rotate()` for the red stamp but we avoid it for the main band to keep glyph hinting intact.

The digit-to-大寫 mapping lives in `lib/chineseNumerals.ts`:

```
const MAP = { '0': '零', '1': '壹', '2': '貳', '3': '參', '4': '肆',
              '5': '伍', '6': '陸', '7': '柒', '8': '捌', '9': '玖' }
export function toChineseNumerals(digits: string): string
```

**Why a helper:** it's reused across the band rendering and its own unit test, it's pure / no deps, and `String.prototype.replace` with a callback isn't readable enough inline. The helper is deliberately dumb — it only handles `0–9`; it does not do "positional Chinese" (e.g. 2428 → 二千四百二十八), because the UX mock uses the literal digit-per-character style (貳肆貳捌), not natural number reading.

**Alternatives considered:**
- Full positional Chinese numerals (`貳仟肆佰貳拾捌`) → doesn't match the mock and is much more code to get right for edge cases.
- Render `2428` as Arabic digits rotated 90° → breaks the "old-school Chinese ticket" typographic feel.

### Decision 3: Line chip — MRT uses first line by code ASC; TRA uses county on neutral chip

For MRT, extend the existing `loadPick` query with a `LEFT JOIN station_lines ON ... LEFT JOIN lines ON ...`, selecting `lines.name_zh` and `lines.color` for the first matching row with ordering `ORDER BY LENGTH(sl.line_code) DESC, sl.line_code ASC LIMIT 1`. For TRA, skip the line join and render a chip using `county` text on `--rule-strong` (hex equivalent of `rgba(26,29,43,0.18)` baked in, since Satori resolves colors at build time not via CSS custom properties).

For MRT, if `station_lines` yields no rows (shouldn't happen for seeded data, but defensive), fall back to the TRA-style county chip.

**Why "longest line_code first, then ASC":** This orders branch/satellite lines (`RA`, `GA` — 2-char) before mainline stems (`R`, `G` — 1-char), and ties within the same length are broken deterministically by ASCII. The practical effect is that a station on a branch (e.g. 新北投 on `R` and `RA`) picks the branch line (新北投支線) — which matches the UX mock and tends to be the more "signature" identifier for that station. For a station only on mainlines (e.g. 台北車站 on `BL` and `R`), the longer `BL` wins, which is also visually acceptable. Deterministic, uses only existing data, no new columns.

**Alternatives considered:**
- Plain `ORDER BY sl.line_code ASC` → would pick 淡水信義線 for 新北投, breaking the mock.
- Render multiple line chips side by side (a 忠孝復興 would get three colored chips) → too busy; the mock shows exactly one chip. Explicit one-line constraint.
- Add a `display_priority` column to `lines` → premature; the length-heuristic is good enough.

### Decision 4: Red 此站有緣 stamp inlined, not a SealMark revival

The red rectangular `此 站 有 緣` stamp below the QR is drawn as a ~64×64 `<div>` with `border: 3px solid #C8954A`, `color: '#C8954A'`, `transform: rotate(-6deg)`, and four spaced characters in a 2×2 flex grid. This is similar in spirit to the retired SealMark but differs in shape (rectangular vs circle), content (`此 站 有 緣` vs `捷運`/`台鐵`), and purpose (brand tag, not pick metadata). Inlining it keeps the Satori-renderer file self-contained — `SealMark.tsx` can be deleted cleanly because the HTML page is also going.

**Alternatives considered:**
- Keep `SealMark.tsx` and adapt it to take new props → false reuse; the shape is different and the component would need `variant='rect-stamp'` complexity for a single caller. Delete both.

### Decision 5: Keep QR target = site root

`qrTarget = ${baseUrl}/`, not `${baseUrl}/comment?token=${token}`. The PNG's audience is the **friend receiving the image**, not the original picker. The picker's own in-app QR (rendered client-side by `ScreenshotSaveBlock` inside the reveal modal) already covers the comment-return path. Two QRs, two audiences; don't merge them.

### Decision 6: Delete the HTML page and SealMark together

The HTML page `/ticket/[token]` has zero inbound links inside the repo. The only surviving reason to keep `SealMark.tsx` was this HTML page (see prior archive's `redesign-result-scan-card` notes where we preserved SealMark explicitly for this route). With the HTML page gone, SealMark's last consumer disappears, and so does the need to preserve the `visual-identity` spec scenario that mandates it. A small delta to `visual-identity/spec.md` retires the seal-mark signature element from the four-element set (rail-tick, kerf, seal, offset-shadow) → becomes three.

**Alternatives considered:**
- Keep the HTML page and re-skin it to match the PNG → wastes effort; no user flow reaches it.
- Keep `SealMark.tsx` as zombie code → violates project rule ("don't keep unused code").

## Risks / Trade-offs

- **Risk**: Satori renders certain CJK glyphs at unexpected widths when packed in small flex cells (e.g. the 2×2 stamp grid). → **Mitigation**: at build time, manually verify via `curl /api/ticket/<token> > out.png && open out.png` on a few station names of varying length (2-char 板橋, 3-char 新北投, 4-char 國父紀念館, 6-char 忠孝新生).
- **Risk**: First-line-ASC ordering surfaces a visually "wrong" line as primary for a multi-line station (e.g. 忠孝復興 might show 板南線 BL instead of 文湖線 BR) → **Mitigation**: document the deterministic ordering in design; if it becomes a problem, add a `display_priority` column in a separate change, not this one.
- **Risk**: TRA stations in the `stations` table may have `county` = NULL (partial seed data) → **Mitigation**: fall back to mode label `台鐵` with neutral chip color when county is missing.
- **Risk**: Removing the HTML page breaks any external bookmark / share-link to `/ticket/<token>` → **Mitigation**: accepted; the HTML surface was never advertised. No redirect added (would pollute the API route with extra logic for near-zero traffic).
- **Trade-off**: The 大寫 band converts `0` to `零`, so pick `No.0042` renders vertically as `零零肆貳` — four characters. The mock uses `貳肆貳捌` which happens to have no zeros. For early picks (No.0001–0099) the visual gets top-heavy with `零` characters. Acceptable: picks rapidly exceed 100 in practice, and the vertical band's role is atmospheric more than legibility.
- **Trade-off**: Deleting SealMark removes it from the component library permanently. If we later decide to reintroduce a seal element on the home-page card, we re-implement or restore from git. Project prefers "delete dead code, recover from git if needed" over "keep for hypothetical future use".

## Migration Plan

1. Ship PNG redesign + helper + deletion in one PR. No feature flag, no rollback branch; the CDN cache (`max-age=3600`) auto-expires within an hour, so worst case a recipient sees the old ticket for up to an hour after deploy. No user data changes.
2. Manual QA: pick a fresh MRT station, pick a fresh TRA station, `curl` the PNGs, visually diff against Image #11.
3. No DB migration. The new SQL join uses existing `lines` / `station_lines` tables.

## Open Questions

None — all prior questions (chip fallback for TRA, vertical rendering technique, HTML page fate, QR target semantics) were answered in the discovery chat and captured under Decisions.
