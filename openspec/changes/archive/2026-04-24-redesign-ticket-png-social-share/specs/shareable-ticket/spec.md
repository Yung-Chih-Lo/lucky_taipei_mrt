## MODIFIED Requirements

### Requirement: Shareable omikuji ticket image is generated server-side
The system SHALL expose a route that generates a 2160×1214 (logical 1080×607 rendered at 2× device pixel ratio) (landscape) PNG image of a pick result formatted as a train ticket. The route SHALL accept a pick token and return an image of the ticket for that pick. The image SHALL be generated server-side using `next/og` `ImageResponse` (or equivalent Satori-based renderer already available in the Next.js 15 runtime) — it SHALL NOT rely on client-side canvas rasterization.

#### Scenario: Route returns a PNG for a valid token
- **WHEN** a client requests `GET /api/ticket/<valid-token>`
- **THEN** the response status SHALL be 200
- **AND** the `Content-Type` header SHALL be `image/png`
- **AND** the response body SHALL be a 2160×1214 (logical 1080×607 rendered at 2× device pixel ratio) PNG image

#### Scenario: Route returns 404 for an unknown token
- **WHEN** a client requests `GET /api/ticket/<token>` for a token that does not exist in `station_picks`
- **THEN** the response status SHALL be 404

#### Scenario: Route caches the image per token
- **WHEN** the same token is requested twice within 1 hour
- **THEN** the second response SHALL be served from cache or be generated from the same deterministic inputs
- **AND** the two response bodies SHALL be byte-identical

### Requirement: Ticket image contains the signature lockup
The generated ticket PNG SHALL contain, at minimum:
- A **left vertical band** running the full canvas height near the left edge, rendering the literal characters `坐`, `火`, `行`, `·`, `命`, `籤`, `第`, the uppercase Chinese digits of the 籤號 (one character per digit, mapped via 零壹貳參肆伍陸柒捌玖), and `號`, each as its own stacked glyph in Noto Serif TC weight 900.
- The **station Chinese name lockup** in Noto Serif TC weight 900 (the largest element, occupying ≥30% of the canvas height).
- The **station English name** (if available) in a smaller italic-style weight below the Chinese name.
- A **line/county chip** rendered on a colored background directly next to or below the English name:
  - For `mrt` picks, the chip SHALL show the Chinese name of the station's first associated line, where "first" is determined by `ORDER BY LENGTH(station_lines.line_code) DESC, station_lines.line_code ASC` (longest line code wins, tie-broken by ASCII ascending). The chip's background color SHALL equal that line's `lines.color`.
  - For `tra` picks, the chip SHALL show the station's `county` text on a neutral ink-muted background; if `county` is NULL, the chip SHALL show `台鐵` instead.
- A **right-column QR block** containing: the caption `同行 · SCAN` above a square QR code, the wordmark `坐火行` below the QR, and a small red rectangular stamp rendered in `--seal` (or an equivalent hex) containing the four characters `此 站 有 緣` arranged in a 2×2 grid, slightly rotated for stamp feel.
- A **bottom row** with the pick date in `YYYY · MM · DD` format on the left and the tagline `命中注定 · 做到哪就去哪` on the right.
- The 籤號 used to generate the vertical band SHALL be derived from the pick's `station_picks.id` (global cumulative pick count), formatted as `String(id).padStart(4, '0')`. It SHALL NOT be derived from the token hash.
- A QR code pointing to the site root (no pick token in the URL) so that anyone who scans a shared ticket is routed to the landing page to draw their own station.

The ticket SHALL NOT contain any emoji characters. The ticket SHALL NOT contain the legacy circular mode-label stamp (`捷運`/`台鐵`) that existed in prior revisions. The ticket SHALL NOT contain dashed kerf borders on the top and bottom edges.

#### Scenario: Chinese station name is present and dominant
- **WHEN** a ticket is generated for a pick whose station's `nameZh` is "七堵"
- **THEN** the generated PNG SHALL render the text "七堵"
- **AND** that text element SHALL be the largest text on the canvas

#### Scenario: Vertical 籤號 band renders uppercase Chinese digits
- **WHEN** a ticket is generated for a pick whose `station_picks.id` is `2428`
- **THEN** the PNG's left vertical band SHALL contain the literal characters `貳`, `肆`, `貳`, `捌` stacked vertically in that order
- **AND** the band SHALL also contain `坐`, `火`, `行`, `命`, `籤`, `第`, `號` as separate glyphs

#### Scenario: Vertical 籤號 band handles leading zeros
- **WHEN** a ticket is generated for a pick whose `station_picks.id` is `42`
- **THEN** the 籤號 used in the vertical band SHALL be `0042`
- **AND** the band SHALL render the glyphs `零`, `零`, `肆`, `貳` in that order

#### Scenario: 籤號 grows beyond 4 digits without truncation
- **WHEN** the pick's `station_picks.id` is `10001`
- **THEN** the PNG vertical band SHALL render five Chinese-digit glyphs corresponding to `10001` (`壹`, `零`, `零`, `零`, `壹`)
- **AND** the band SHALL NOT truncate or wrap

#### Scenario: Pick date is present in bottom row
- **WHEN** a ticket is generated for a pick created on `2026-04-22`
- **THEN** the PNG SHALL contain the text `2026 · 04 · 22`

#### Scenario: MRT line chip prefers the longer line_code (branch over mainline)
- **WHEN** a ticket is generated for an MRT pick whose station has rows in `station_lines` linking to lines with codes `R` (length 1) and `RA` (length 2)
- **THEN** the line chip SHALL display the `lines.name_zh` value for the row with code `RA`
- **AND** the chip's background color SHALL equal the `lines.color` value for that row

#### Scenario: MRT line chip tie-breaks by ASCII ascending among same-length codes
- **WHEN** a ticket is generated for an MRT pick whose station has rows in `station_lines` linking to lines with codes `BL` and `BR` (both length 2)
- **THEN** the line chip SHALL display the `lines.name_zh` value for the row with code `BL`

#### Scenario: TRA chip falls back to county
- **WHEN** a ticket is generated for a TRA pick whose station has `county` = `宜蘭縣`
- **THEN** the PNG SHALL display a chip containing the text `宜蘭縣`
- **AND** the chip SHALL NOT use any `lines.color` value

#### Scenario: Legacy mode-label circle stamp is absent
- **WHEN** the generated PNG is inspected
- **THEN** it SHALL NOT contain a circular stamp labeled `捷運` or `台鐵`

#### Scenario: Red 此站有緣 stamp is present in the QR block
- **WHEN** the generated PNG is inspected
- **THEN** a rectangular stamp element SHALL be present in the right-column QR block
- **AND** it SHALL contain the four characters `此`, `站`, `有`, `緣`
- **AND** its border and text SHALL render in a red/seal tone (equivalent to `--seal` in the public palette)

#### Scenario: QR code resolves to the site root
- **WHEN** the QR code in the generated PNG is scanned
- **THEN** it SHALL decode to an absolute HTTPS URL equal to the site origin with a trailing slash (e.g. `https://example.com/`)
- **AND** that URL SHALL NOT contain the pick token as a path segment or query parameter
- **AND** loading that URL SHALL render the app landing page
