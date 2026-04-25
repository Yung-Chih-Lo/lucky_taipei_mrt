## 1. Chinese numerals helper

- [x] 1.1 Create `lib/chineseNumerals.ts` exporting `toChineseNumerals(digits: string): string` that maps each ASCII digit `0–9` to `零壹貳參肆伍陸柒捌玖`, leaving non-digit characters unchanged.
- [x] 1.2 Create `lib/chineseNumerals.test.ts` with coverage for: single digit, 4-digit pick number, leading zeros (`0042` → `零零肆貳`), 5-digit overflow (`10001` → `壹零零零壹`), empty string.

## 2. PNG route data layer

- [x] 2.1 Extend the `loadPick` query in `app/api/ticket/[token]/route.tsx` (or factor a helper) to also fetch the first line row for MRT picks: `LEFT JOIN station_lines sl ON sl.station_id = s.id LEFT JOIN lines l ON l.code = sl.line_code WHERE p.token = ? ORDER BY sl.line_code ASC LIMIT 1` returning `line_name_zh` and `line_color`.
- [x] 2.2 When `transport_type = 'tra'`, skip the line join and let the chip renderer fall back to `county` / `台鐵`.
- [x] 2.3 Verify the query shape works against the seeded dev DB with a quick `sqlite3` check (e.g. pick a known MRT station, confirm ORDER BY result matches expectation).

## 3. PNG route layout — remove legacy

- [x] 3.1 Remove the header row with `坐火行` wordmark + `No.XXXX` + dashed border from the existing JSX.
- [x] 3.2 Remove the circular stamp element (the `<div>` with `borderRadius: 999` and `transform: rotate(-8deg)` containing `modeLabel`).
- [x] 3.3 Remove the dashed border bottom footer and the `ZUOHUO XING` caption row.
- [x] 3.4 Remove the center-block `台北捷運 · YYYY.MM.DD` line under the station English name.
- [x] 3.5 Adjust the root container padding (currently `44px 64px`) as needed so the new left vertical band has room without clipping.

## 4. PNG route layout — left vertical band

- [x] 4.1 Add a flex-column wrapper pinned to the left edge of the canvas, rendering each character of `坐`, `火`, `行`, `·`, `命`, `籤`, `第`, `<大寫籤號每字>`, `號` as its own `<div>` stacked top-to-bottom.
- [x] 4.2 Apply Noto Serif TC weight 900, sized so the full band fits vertically within the 607px canvas at reasonable spacing (verify empirically).
- [x] 4.3 Import `toChineseNumerals` and use it to transform `String(pick.id).padStart(4, '0')` before splitting into glyphs.

## 5. PNG route layout — center column

- [x] 5.1 Keep the eyebrow `此 站 有 緣` above the station name; remove the spaced-uppercase feel if needed to match the mock's tighter tracking.
- [x] 5.2 Keep the station name lockup as the largest element; tune `nameFontSize` per character count so 2-, 3-, 4-, and 6-character names all fit within the available column width without overlapping the left band or right column.
- [x] 5.3 Render the English name below the Chinese (not uppercase) in an italic-style weight; keep the existing `pick.name_en.toUpperCase()` call if it reads better, but remove the extra letter-spacing if needed.
- [x] 5.4 Add the line/county chip directly below or beside the English name: MRT uses `line_name_zh` on `line_color` background; TRA uses `county` (or `台鐵` if null) on a neutral ink-muted background. Use rounded corners and snug horizontal padding.

## 6. PNG route layout — right column (QR block)

- [x] 6.1 Move the existing QR into a flex-column right block with the caption `同行 · SCAN` above the QR.
- [x] 6.2 Keep `qrTarget = ${baseUrl}/` — do NOT add a token query param. Verify the existing QR generation call is unchanged.
- [x] 6.3 Below the QR, render a small `坐火行` wordmark in Noto Serif TC, followed by a red rectangular stamp (~64×64, `border: 3px solid #C8954A`, `color: #C8954A`, `transform: rotate(-6deg)`) containing the four characters `此 站 有 緣` in a 2×2 flex grid.

## 7. PNG route layout — bottom row

- [x] 7.1 After the center + right columns, add a bottom row with date on the left (format `YYYY · MM · DD` using the existing `formatDate` helper, but replacing `.` with ` · ` — introduce a new helper `formatDateWithMidDot` or inline the transform).
- [x] 7.2 On the right of the bottom row, render the tagline `命中注定 · 做到哪就去哪` in muted ink, similar size to the eyebrow.
- [x] 7.3 Confirm no dashed borders anywhere in the new layout.

## 8. Delete dead code

- [x] 8.1 Delete `app/(public)/ticket/[token]/page.tsx` and its empty parent folder if it becomes empty.
- [x] 8.2 Delete `components/omikuji/SealMark.tsx`.
- [x] 8.3 Run `grep -rn "SealMark" --include='*.ts' --include='*.tsx' .` to confirm no remaining references.

## 9. Manual QA

- [x] 9.1 Start the dev server and pick an MRT station with known line membership; fetch `/api/ticket/<token>` and visually diff against Image #11. Station name should dominate, chip should carry line color.
- [x] 9.2 Pick a TRA station; fetch the PNG; confirm chip shows `<county>` (or `台鐵` if county is missing) on neutral background.
- [ ] 9.3 Pick a station with a 2-char Chinese name (e.g. 板橋), a 6-char name (e.g. 國父紀念館), and a long English name — confirm nothing overflows or overlaps the left band or right QR column.
- [ ] 9.4 Verify the left vertical band correctly renders leading zeros (pick a low-ID test pick if possible, or manually craft one) — confirm `零` glyphs show without baseline drift.
- [ ] 9.5 Scan the QR in the generated PNG with a phone camera; confirm it opens `https://<site>/` (not `/comment?token=...`).
- [x] 9.6 Fetch `/ticket/<token>` directly in a browser; confirm it returns 404 (the HTML page is gone).
- [ ] 9.7 On a phone, tap 「分享給你的好友」 and confirm the native share sheet receives the **new** PNG bytes (may need to bust cache / use a fresh token after deploy).
