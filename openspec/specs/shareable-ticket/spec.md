# shareable-ticket Specification

## Purpose
A 1080×1920 omikuji-ticket PNG generated server-side from a pick token,
paired with a client share button that prefers the Web Share API and falls
back to opening the PNG in a new tab. Drives the product's growth loop by
producing a memorable, screenshottable artifact for every successful pick.
## Requirements
### Requirement: Shareable omikuji ticket image is generated server-side
The system SHALL expose a route that generates a 1080×1920 PNG image of a pick result formatted as an omikuji ticket. The route SHALL accept a pick token and return an image of the ticket for that pick. The image SHALL be generated server-side using `@vercel/og` (or equivalent already available in the Next.js 15 runtime) — it SHALL NOT rely on client-side canvas rasterization.

#### Scenario: Route returns a PNG for a valid token
- **WHEN** a client requests `GET /api/ticket/<valid-token>`
- **THEN** the response status SHALL be 200
- **AND** the `Content-Type` header SHALL be `image/png`
- **AND** the response body SHALL be a 1080×1920 PNG image

#### Scenario: Route returns 404 for an unknown token
- **WHEN** a client requests `GET /api/ticket/<token>` for a token that does not exist in `station_picks`
- **THEN** the response status SHALL be 404

#### Scenario: Route caches the image per token
- **WHEN** the same token is requested twice within 1 hour
- **THEN** the second response SHALL be served from cache or be generated from the same deterministic inputs
- **AND** the two response bodies SHALL be byte-identical

### Requirement: Ticket image contains the signature lockup
The generated ticket PNG SHALL contain, at minimum:
- The station name lockup in Noto Serif TC weight 900 (the largest element, occupying ≥30% of the canvas height).
- The English name (if available) in a smaller weight above the Chinese name.
- The 籤號 `No.XXXX` rendered in JetBrains Mono (or a monospace fallback).
- The pick date in `YYYY.MM.DD` format.
- The seal mark in `--seal` color containing the mode label (`捷運` or `台鐵`).
- The brand wordmark `下一站 · 幸運車站` in small caption type.
- A QR code pointing to the public URL of the station or pick (resolved by the server).
- The kerf-edge treatment (dashed top and bottom) so the image reads as a ticket stub.

The ticket SHALL NOT contain any emoji characters.

#### Scenario: Chinese station name is present and dominant
- **WHEN** a ticket is generated for a pick whose station's `nameZh` is "七堵"
- **THEN** the generated PNG SHALL render the text "七堵"
- **AND** that text element SHALL be the largest text on the canvas

#### Scenario: 籤號 and date are present
- **WHEN** a ticket is generated for a pick created on `2026-04-22` with an issued 籤號 `0428`
- **THEN** the PNG SHALL contain the text `No.0428`
- **AND** the PNG SHALL contain the text `2026.04.22`

#### Scenario: Seal mark carries the mode label
- **WHEN** a ticket is generated for a pick whose `transport_type` is `tra`
- **THEN** the seal mark SHALL contain the text `台鐵`
- **AND** the seal fill color SHALL resolve to the `--seal` value

#### Scenario: QR code resolves to the comment page for this pick
- **WHEN** the QR code in the generated PNG is scanned
- **THEN** it SHALL decode to an absolute HTTPS URL of the form `{origin}/comment?token={token}`
- **AND** that URL SHALL load the comment submission page for this pick

### Requirement: Result modal exposes a share action
The picker's result modal SHALL include a "分享這張籤" (share) action alongside the existing "留下心得" CTA. The action SHALL either open the generated ticket PNG in a new tab for manual save or trigger a download, depending on the platform's Web Share API support. When the Web Share API is available, the app SHALL prefer native share with the PNG payload.

#### Scenario: Share button is present in modal
- **WHEN** the result modal opens after a successful pick
- **THEN** the modal SHALL contain a visible share button labeled "分享這張籤"
- **AND** the share button SHALL be reachable with keyboard focus

#### Scenario: Native share on supported browsers
- **WHEN** the user activates the share button and the browser supports `navigator.share` with file support
- **THEN** the app SHALL call `navigator.share({ files: [<png>] })` with the generated ticket PNG
- **AND** it SHALL NOT open a new tab as a fallback

#### Scenario: Fallback on unsupported browsers
- **WHEN** the user activates the share button and the browser does NOT support `navigator.share` with files
- **THEN** the app SHALL open the ticket PNG URL in a new tab
- **AND** it SHALL provide a visible hint (e.g. copy text or keyboard instruction) for saving the image

### Requirement: Ticket fonts and assets are bundled, not fetched at request time
Font files required to render the ticket SHALL be bundled in `public/fonts/` (or imported via a path the runtime can read from the local filesystem). The ticket generation path SHALL NOT make outbound HTTP requests to Google Fonts or any third-party CDN during image generation.

#### Scenario: No outbound font fetch at request time
- **WHEN** the ticket route generates a PNG in production
- **THEN** it SHALL NOT issue outbound HTTP requests to `fonts.googleapis.com` or `fonts.gstatic.com`
- **AND** the font bytes SHALL be read from a local path under the app bundle

#### Scenario: Subset covers all station names
- **WHEN** the ticket is generated for any station present in the `stations` table
- **THEN** all characters in the station's `nameZh` SHALL render correctly (no `.notdef` / tofu glyphs)
- **AND** the subset font file SHALL be sized to cover the station-name character set plus common caption glyphs
