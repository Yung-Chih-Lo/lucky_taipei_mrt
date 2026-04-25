## Why

The shared ticket PNG is the product's primary growth artifact — it's the image a friend receives when the original picker taps 「分享給你的好友」, and it needs to read like a real train ticket so a recipient instantly thinks *"我也想抽一張"*. The current PNG still carries debris from an older portrait layout (a 捷運/台鐵 circle stamp, uppercase English-only line, dashed kerf header/footer) and is missing the signature train-ticket cues in the UX mock: the vertical 「坐火行 · 命籤 第 ○○○○ 號」 left-side band, a pink/color line chip under the station name, and a red rectangular 「此 站 有 緣」 stamp paired with the QR. The owner-facing HTML page at `/ticket/[token]` is also dead weight — no one reaches it (friends receive the PNG, not a URL), and keeping it alive forces us to maintain `SealMark` as a component with no consumer.

## What Changes

- **PNG redesign** (`app/api/ticket/[token]/route.tsx`): redraw the entire 1080×607 landscape canvas to match the train-ticket UX mock:
  - **Add** left vertical band: `坐火行 · 命籤 第 <大寫數字> 號`, character-per-line stacked (e.g. pick id `2428` renders as `貳肆貳捌`).
  - **Add** line chip under the station English name: for MRT stations use the first associated line (by `station_lines.line_code` ASC) and render the chip in that line's `lines.color`; for TRA stations use the county string rendered on a neutral `--rule-strong` background.
  - **Add** right-column QR caption `同行 · SCAN` above the QR, and a small red rectangular `此 站 有 緣` stamp below the QR next to the `坐火行` wordmark.
  - **Remove** the existing circle stamp containing `捷運`/`台鐵`.
  - **Remove** the dashed-border header (`坐火行 | No.XXXX` row) and dashed-border footer — replace with a clean bottom row showing `YYYY · MM · DD` on the left and `命中注定 · 做到哪就去哪` on the right.
  - **Keep** PNG dimensions at 1080×607 (landscape, ~16:9), QR target at `${baseUrl}/` (friend-facing growth hook, not a comment entry point), and `Cache-Control: public, max-age=3600, immutable`.
- **BREAKING** Remove HTML surface and dead component:
  - **Remove** `app/(public)/ticket/[token]/page.tsx` entirely — the route stops serving HTML (the PNG route at `/api/ticket/[token]` is untouched).
  - **Remove** `components/omikuji/SealMark.tsx` — the only remaining consumer was the HTML ticket page; the PNG route inlines its own stamp geometry with `next/og` primitives, so no replacement component is needed.
- **Add** helper `lib/chineseNumerals.ts` exporting `toChineseNumerals(digits: string): string` that maps each digit `0–9` to 零壹貳參肆伍陸柒捌玖. Used by the PNG route for the vertical 籤號 rendering.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `shareable-ticket`: PNG layout requirements replaced end-to-end — vertical 大寫數字 band, color-coded line/county chip, red rectangular 此站有緣 stamp, and removal of circle mode stamp / dashed kerf are now spec-level requirements. The 1080×1920 portrait dimension in the old spec is corrected to 1080×607 landscape to match the image's role as a Line/WhatsApp preview card rather than an IG Story.
- `visual-identity`: the `SealMark` component is retired from the four-element signature set; seal mark is no longer a brand primitive that result cards must carry.

## Impact

- **Code**:
  - `app/api/ticket/[token]/route.tsx` — rewritten layout
  - `app/(public)/ticket/[token]/page.tsx` — deleted
  - `components/omikuji/SealMark.tsx` — deleted
  - `lib/chineseNumerals.ts` — new, with unit tests at `lib/chineseNumerals.test.ts`
  - `db/queries.ts` or an inline `sqlite.prepare` in the PNG route — add a lookup for a station's first line code and color
- **Specs**: `shareable-ticket/spec.md` (large delta), `visual-identity/spec.md` (small delta retiring the seal mark signature element)
- **Dependencies**: none added. `next/og`, `qrcode`, existing `lines`/`station_lines` tables, existing CSS tokens.
- **Share flow**: unchanged — `ShareableTicket` component continues to fetch the same `/api/ticket/<token>` URL; only the pixels returned are different.
- **Reveal modal QR**: unchanged — the modal's `ScreenshotSaveBlock` QR continues to point at `/comment?token=...` for owner-side screenshotting. Two QRs, two audiences.
- **Users who bookmarked `/ticket/<token>` HTML URLs**: will hit 404 after this ships. Acceptable blast radius: the HTML page was never linked from anywhere inside the app.
