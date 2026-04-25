# visual-identity Specification

## Purpose
Defines the shared visual language of the public-facing picker and community
pages. Anchors on one paper-based palette, one typography pair, and the
"Urban Omikuji Press" signature elements so that MRT and TRA modes read as a
single product whose only per-mode difference is an accent hue.
## Requirements
### Requirement: Public-facing brand name and slogan
The public site SHALL present the brand as **「下一站 · 幸運車站」** with slogan **「搖一搖，讓城市替你決定今天」**. The `<title>` metadata, the top-bar wordmark, and any marketing copy SHALL use this name. The prior strings "Lucky Station", "隨機捷運 GO！", and the emoji 🚇 SHALL NOT appear on any public page. The string "捷運籤" MAY appear only as a historical callout; it SHALL NOT be the primary brand label.

#### Scenario: Home page title metadata
- **WHEN** a user loads `/`
- **THEN** the document `<title>` SHALL contain "下一站" or "幸運車站"
- **AND** the page SHALL NOT contain the literal strings "Lucky Station", "隨機捷運 GO！", or the 🚇 emoji

#### Scenario: Top-bar wordmark
- **WHEN** the top bar renders on any `(public)` route
- **THEN** its wordmark SHALL read "下一站" (primary) with "幸運車站" as secondary caption (or a visually equivalent stacked lockup)
- **AND** the wordmark area SHALL NOT contain any emoji character

### Requirement: Single source of truth for brand tokens
The system SHALL expose brand tokens (colors, fonts, radii) for both the MRT and TRA themes from one TypeScript module that feeds both the antd `ConfigProvider` themes and CSS custom properties on `<html>`. Hex literals for brand colors SHALL NOT appear inline in component files; components SHALL reference tokens via the antd theme, CSS variables, or re-exported constants. The module SHALL export named theme objects (e.g. `mrtTheme`, `traTheme`), not a single anonymous default.

#### Scenario: Palette change propagates everywhere
- **WHEN** a brand token value is changed in the single source module
- **THEN** both the antd CTA button and any custom border/ring on a non-antd element SHALL reflect the new value after reload
- **AND** no component file SHALL require a separate edit

#### Scenario: Both themes change in lockstep when tokens are renamed
- **WHEN** the brand tokens module renames a token
- **THEN** both the MRT theme and the TRA theme exports SHALL reference the new name
- **AND** components SHALL continue to work after a single coordinated edit

#### Scenario: No hex leaks in components
- **WHEN** the public component files are scanned
- **THEN** they SHALL NOT contain brand color hex literals
- **AND** they MAY reference DB-driven line colors (from `lines.color`) directly, since those are data, not brand tokens

### Requirement: Color system — paper base with accent-hue mode swap
Both MRT and TRA modes SHALL share ONE palette. Mode identity SHALL differ only by a single accent hue; every other token (background, surface, surface-elevated, ink, ink-muted, rule, seal, success, warn) SHALL be identical across modes. The shared base is a warm paper background (`#F3ECDC`) with opaque paper surfaces (`#FFFBF0`) and ink text (`#1A1D2B`). MRT mode SHALL use 朱砂紅 `#E8421C` as the accent. TRA mode SHALL use 鐵道深藍 `#15365C` as the accent. A seal gold `#C8954A` SHALL be reserved for the stamp mark on a successful pick. The 6 Taipei MRT line colors (from the DB) SHALL continue to drive station / connection / line-chip colors in MRT mode and SHALL NOT be overridden.

#### Scenario: MRT primary CTA color
- **WHEN** the "抽．下．一．站" button renders in MRT mode in its default enabled state
- **THEN** its background SHALL resolve to the MRT `--accent` token (`#E8421C`)
- **AND** its text contrast ratio against that background SHALL be at least 4.5:1 for text ≥14px bold

#### Scenario: TRA primary CTA color
- **WHEN** the primary CTA button renders in TRA mode in its default enabled state
- **THEN** its background SHALL resolve to the TRA `--accent` token (`#15365C`)
- **AND** its text contrast ratio against that background SHALL be at least 4.5:1

#### Scenario: Body text contrast on paper background
- **WHEN** any body-text element renders on `--paper-bg` in either mode
- **THEN** the resolved text color SHALL produce a contrast ratio of at least 4.5:1 against the background
- **AND** primary body text SHALL resolve to `--ink`; secondary labels SHALL resolve to `--ink-muted`

#### Scenario: Mode switch only changes accent
- **WHEN** a user switches between MRT and TRA tabs
- **THEN** only the `--accent` (and its derived `--accent-soft` hover/selected tint) SHALL change
- **AND** every other token (`--paper-bg`, `--paper-surface`, `--ink`, `--ink-muted`, `--rule`, `--seal`, `--success`, `--warn`) SHALL be identical across both modes

#### Scenario: Seal token appears only on the stamp mark
- **WHEN** the public surface is scanned for use of `--seal`
- **THEN** `--seal` SHALL only be consumed by the stamp-mark component on a successful pick card
- **AND** `--seal` SHALL NOT appear as a CTA, border, or body text color

#### Scenario: Line chips keep DB colors in MRT mode
- **WHEN** an MRT line chip renders for a line whose `lines.color` is `#0070bd`
- **THEN** the chip fill SHALL be `#0070bd`
- **AND** no brand token SHALL override this value

### Requirement: Typography system — Noto Serif TC for ritual moments, Noto Sans TC for UI
The public site SHALL load Noto Serif TC (weights 500, 900) and Noto Sans TC (weights 400, 500, 700) via `next/font/google`, exposing them as CSS variables `--font-serif` and `--font-sans`. Noto Serif TC at weight 900 SHALL be used for ritual-moment text: the brand wordmark, the station-name lockup, and the display-size page titles. Noto Sans TC SHALL be used for all other UI text — buttons, helper labels, line/county checkbox labels, body copy, and map station labels. JetBrains Mono SHALL be loaded only on pages that render the shareable ticket (for the 籤號 `No.XXXX` field).

#### Scenario: Station name lockup uses serif
- **WHEN** the result modal reveals a station name
- **THEN** the station's Chinese name element SHALL compute `font-family` to Noto Serif TC (or its CSS-variable reference)
- **AND** the font weight SHALL be 900

#### Scenario: Brand wordmark in top bar uses serif
- **WHEN** the top-bar brand wordmark「下一站 · 幸運車站」renders
- **THEN** its computed `font-family` SHALL be Noto Serif TC
- **AND** the font weight SHALL be at least 700

#### Scenario: Non-wordmark UI text uses sans
- **WHEN** a button label, helper text, checkbox label, page-section heading, or map station label renders
- **THEN** the computed `font-family` SHALL be Noto Sans TC
- **AND** this rule SHALL NOT apply to the brand wordmark or the station-name lockup

#### Scenario: Fonts load via next/font
- **WHEN** `app/layout.tsx` is inspected
- **THEN** it SHALL import both fonts from `next/font/google` with `subsets: ['latin']` plus `preload: true` for weights actually used above the fold
- **AND** it SHALL NOT rely on `@import url()` inside a CSS file or a `<link>` to `fonts.googleapis.com`

### Requirement: Ritual reveal for the result modal
The random-pick result modal SHALL reveal the station name using the omikuji ritual defined in the `omikuji-reveal` capability. When `prefers-reduced-motion: reduce` is set, the modal SHALL skip the ritual and render the final reveal state immediately. The station name SHALL be the dominant visual element in the modal (serif, ≥40px). Wiki and Google Maps links SHALL render as pill-shaped buttons with inline SVG icons; no emoji characters SHALL appear.

#### Scenario: Modal delegates to RevealRitual
- **WHEN** the result modal opens
- **THEN** it SHALL render the `<RevealRitual>` component and pass the station data
- **AND** the station name SHALL end up as the visually dominant element (largest text on screen)

#### Scenario: prefers-reduced-motion
- **WHEN** the user's OS reports `prefers-reduced-motion: reduce`
- **THEN** the reveal SHALL skip the ritual animation and render the final state immediately
- **AND** the 2-second station-name cycling animation (if any) SHALL collapse to a single-frame reveal

#### Scenario: No emoji in links
- **WHEN** the Wiki and Google Maps links render
- **THEN** their icons SHALL be inline SVG (e.g. antd `@ant-design/icons`)
- **AND** their rendered text + accessible name SHALL NOT contain any emoji character

### Requirement: Tab-driven mode switching on the home page
The home page (`/`) SHALL switch the active mode based on the selected transport tab in the top bar. Mode switching SHALL update both the antd `ConfigProvider` and the `<html data-theme>` attribute so CSS variables and antd components stay synchronized. Tabs SHALL live in the top bar, not inside any page-level component.

#### Scenario: Initial render uses MRT mode
- **WHEN** the home page is first rendered
- **THEN** `<html>` SHALL have `data-theme="mrt"`
- **AND** the antd `ConfigProvider` for the public surface SHALL receive the MRT accent config

#### Scenario: User switches to TRA tab
- **WHEN** the user clicks the TRA tab in the top bar
- **THEN** `<html>` SHALL update to `data-theme="tra"`
- **AND** the antd `ConfigProvider` for the public surface SHALL re-render with the TRA accent config
- **AND** all public CSS that reads `--accent` SHALL reflect the TRA accent value without page reload

#### Scenario: Theme transition is smooth
- **WHEN** the active mode switches between MRT and TRA
- **THEN** `--accent`-driven properties (CTA backgrounds, active tab underline, selected county fill) SHALL transition over 150–300ms
- **AND** `prefers-reduced-motion: reduce` users SHALL receive an instant switch with no transition

### Requirement: Shared community pages are pinned to the MRT mode
The `/explore`, `/stats`, and `/comment` pages SHALL render with the MRT accent regardless of which transport type the displayed content belongs to. These pages SHALL NOT switch mode based on per-row transport type or any user preference. The top bar on these pages SHALL still show both tabs; clicking a non-active tab SHALL navigate to `/` in that mode.

#### Scenario: /explore uses MRT accent
- **WHEN** a visitor loads `/explore`
- **THEN** `<html>` SHALL have `data-theme="mrt"`
- **AND** the rendered UI SHALL use the MRT `--accent` value

#### Scenario: /stats uses MRT accent
- **WHEN** a visitor loads `/stats`
- **THEN** `<html>` SHALL have `data-theme="mrt"`
- **AND** the leaderboard SHALL render with MRT accent even when the active scope is `tra`

#### Scenario: /comment uses MRT accent regardless of token's transport_type
- **WHEN** a visitor loads `/comment?token=<token>` for a token whose `station_picks.transport_type = 'tra'`
- **THEN** `<html>` SHALL have `data-theme="mrt"`
- **AND** the page SHALL NOT switch to the TRA accent

#### Scenario: Tab click on community page navigates home
- **WHEN** a visitor on `/explore`, `/stats`, or `/comment` clicks a tab in the top bar
- **THEN** the app SHALL navigate to `/` with that tab active

### Requirement: Interactive elements have visible focus and pointer affordance
All clickable or focusable elements on the public surface SHALL show a visible focus ring when reached via keyboard and SHALL present `cursor: pointer` on hover for mouse users. Focus rings SHALL be at least 2px wide and SHALL have contrast ≥ 3:1 against the adjacent surface.

#### Scenario: Keyboard focus on CTA
- **WHEN** the user tabs to the primary CTA button
- **THEN** a visible focus ring SHALL appear around the button
- **AND** the ring SHALL be at least 2px wide with at least 3:1 contrast against the button background

#### Scenario: Hover cursor
- **WHEN** the user hovers any clickable element (CTA, checkbox, pill link, modal close)
- **THEN** the cursor SHALL be `pointer`

### Requirement: Persistent top bar on all public routes
Every `(public)` route (`/`, `/explore`, `/stats`, `/comment`) SHALL render a persistent top bar provided by the public layout. The top bar SHALL contain three regions: (a) left — brand wordmark that links to `/`, (b) center — mode tabs (捷運 / 台鐵), (c) right — text links `旅人心得` and `排行榜`. The tabs and social nav SHALL NOT be duplicated inside any page-level component. The top bar SHALL be 64px tall on desktop and separated from the main content area by a 1px `--rule` hairline. No login control SHALL appear in the public top bar; admin authentication remains at `/admin/login` and is not reachable from public navigation.

#### Scenario: Top bar is present on home
- **WHEN** a visitor loads `/`
- **THEN** the DOM SHALL contain exactly one `<TopBar>` (or equivalent) rendered by the `(public)` layout
- **AND** tabs and social nav SHALL NOT be duplicated inside `HomeClient`, `TraPicker`, or `MrtPicker`

#### Scenario: Top bar is present on community pages
- **WHEN** a visitor loads `/explore`, `/stats`, or `/comment`
- **THEN** the DOM SHALL contain exactly one `<TopBar>` with the same three regions
- **AND** the right-side nav links SHALL link to `/explore`, `/stats`, and trigger the login flow respectively

#### Scenario: Active tab uses underline, not filled pill
- **WHEN** a tab is active
- **THEN** its indicator SHALL be a 2px bottom border in `--accent`
- **AND** it SHALL NOT be a filled-background pill

### Requirement: Single-card picker layout with internal rail-tick divider
The home picker SHALL render as ONE card (the "omikuji paper") containing two internal panes — left: line/county picker; right: map or schematic. The two panes SHALL be separated by a single 1px vertical `--rule` line, optionally decorated with rail-tick marks. The vestigial "台灣縣市" eyebrow heading SHALL be removed. Both panes SHALL share the same top padding so their top edges align. Inner content SHALL NOT be wrapped in a second card-on-card nest.

#### Scenario: No double-card nesting
- **WHEN** the home picker DOM is inspected
- **THEN** there SHALL be exactly one outer card (the omikuji card)
- **AND** neither the picker sidebar nor the map container SHALL apply a `.brand-glass` or other card-like background/border inside the outer card

#### Scenario: Eyebrow "台灣縣市" is removed
- **WHEN** the TRA picker renders
- **THEN** the text "台灣縣市" (as a heading above the map) SHALL NOT appear
- **AND** the map SHALL fill the right pane from the pane's top padding

#### Scenario: Left and right panes share top edge
- **WHEN** the picker card renders on viewports ≥960px
- **THEN** the first visible element of the left pane and the first visible element of the right pane SHALL have the same `offsetTop` within the card (±4px tolerance)

#### Scenario: Responsive stacking on narrow viewports
- **WHEN** the viewport width is below 960px
- **THEN** the two panes SHALL stack vertically (left pane on top)
- **AND** the internal divider SHALL rotate to horizontal (a 1px `--rule` line above the right pane)

### Requirement: Paper surface treatment replaces glassmorphism
The public surface SHALL use opaque paper backgrounds, not glassmorphism. The `.brand-glass` class (translucent white fill + backdrop-filter blur) SHALL NOT be applied to any public card, modal, or sidebar. Cards SHALL use `background: var(--paper-surface)` with a 1px `--rule` border and a subtle two-color offset shadow (`2px 2px 0 --accent, -2px -2px 0 --ink` at low opacity) that evokes printing misregistration. A very subtle paper grain MAY be applied via a background image filter at ≤3% intensity.

#### Scenario: No glassmorphism in picker card
- **WHEN** the picker card renders on any `backdrop-filter`-supporting browser
- **THEN** its background SHALL be opaque (`--paper-surface`)
- **AND** no `backdrop-filter` property SHALL be applied

#### Scenario: No glassmorphism in result modal
- **WHEN** the result modal renders
- **THEN** its content background SHALL be `--paper-surface-elevated` (opaque)
- **AND** no `backdrop-filter` property SHALL be applied

#### Scenario: Brand-glass class is not referenced in public components
- **WHEN** the public component tree (`app/(public)/**`, `components/mrt/**`, `components/tra/**`, `components/omikuji/**`) is scanned
- **THEN** no element SHALL carry the `className` `brand-glass`
- **AND** the `.brand-glass` rule SHALL NOT exist in `globals.css`

### Requirement: Signature visual elements
The public surface SHALL express three signature elements: (1) a **rail-tick rule** — a horizontal/vertical 1px `--rule` line decorated with repeating short tick marks, used as a divider between top bar and content, between picker panes, and between result-card regions; (2) a **kerf edge** — a dashed top/bottom edge on the omikuji card evoking a torn ticket; (3) a **two-color offset shadow** — a dual-tone micro shadow on cards evoking risograph misregistration. These elements SHALL be implemented as reusable React components or CSS utility classes so consuming pages do not reimplement them.

The legacy fourth element — a circular `<SealMark>` stamp carrying pick date and 籤號 — is retired. Result cards SHALL NOT render `<SealMark>` as a brand primitive; the shareable-ticket PNG inlines its own stamp geometry for the `此站有緣` red rectangular stamp, and no other surface requires a seal element.

#### Scenario: Rail-tick rule available as a reusable primitive
- **WHEN** a page needs a divider
- **THEN** it SHALL use `<RailTickRule>` (or a shared class such as `.rail-tick-rule`)
- **AND** no page SHALL hard-code the tick geometry inline

#### Scenario: Kerf edge on omikuji card
- **WHEN** the outer omikuji card renders on the home page
- **THEN** its top and bottom edges SHALL show a dashed kerf (CSS `border-style: dashed` or SVG equivalent at 4px dash / 2px gap)

#### Scenario: No SealMark component in the public component tree
- **WHEN** the public component tree (`app/(public)/**`, `components/mrt/**`, `components/tra/**`, `components/omikuji/**`) is scanned
- **THEN** no element SHALL render `<SealMark>`
- **AND** the `components/omikuji/SealMark.tsx` file SHALL NOT exist

