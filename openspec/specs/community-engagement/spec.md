# community-engagement Specification

## Purpose
TBD - created by archiving change add-multi-transport-community. Update Purpose after archive.
## Requirements
### Requirement: Token-based station pick records every selection
The system SHALL persist every random pick into the `station_picks` table with a server-generated, unique, opaque token. The token SHALL be a UUIDv4 string returned in the API response so the client can immediately link to a comment form.

#### Scenario: Successful pick returns a token
- **WHEN** a client calls `POST /api/pick` with a valid body identifying transport type and selection criteria
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL include a `token` field matching UUIDv4 format
- **AND** a new row SHALL exist in `station_picks` with that token, the resolved `station_id`, the matching `transport_type`, `picked_at` set to the current unix milliseconds, and `comment_used` set to 0

#### Scenario: Token uniqueness collision
- **WHEN** a token generation by chance collides with an existing row's token
- **THEN** the insert SHALL fail with a uniqueness constraint
- **AND** the API SHALL retry generation up to 3 times before returning a 500 error

### Requirement: Pick API resolves a station from server-side criteria
The `POST /api/pick` endpoint SHALL accept a JSON body of the form `{ transport_type: 'mrt' | 'tra', filter: <type-specific> }`. The server SHALL resolve the candidate set entirely from the database (never trusting a client-supplied station id or name) and randomly select one station from that set.

#### Scenario: Pick by mrt with line filter
- **WHEN** a client posts `{ transport_type: 'mrt', filter: { line_codes: ['BR', 'R'] } }`
- **THEN** the server SHALL select uniformly at random from stations whose `transport_type = 'mrt'` AND that belong to at least one of the listed lines via `station_lines`
- **AND** the response SHALL include `{ token, station: { id, name_zh, name_en, line_codes: [...] } }`

#### Scenario: Pick by tra with county filter
- **WHEN** a client posts `{ transport_type: 'tra', filter: { counties: ['台北市', '宜蘭縣'] } }`
- **THEN** the server SHALL select uniformly at random from stations whose `transport_type = 'tra'` AND `county` is in the listed counties
- **AND** the response SHALL include `{ token, station: { id, name_zh, county } }`

#### Scenario: Empty candidate set
- **WHEN** the resolved candidate set contains zero stations
- **THEN** the response status SHALL be 422
- **AND** the response body SHALL include `{ error: 'no_candidates' }` with no token created

#### Scenario: Invalid transport_type
- **WHEN** the body's `transport_type` is not `mrt` or `tra`
- **THEN** the response status SHALL be 400
- **AND** no row SHALL be inserted into `station_picks`

### Requirement: Comments are anonymous and tied to a single token
The system SHALL allow exactly one comment per token. Comment submission SHALL be exposed at `POST /api/comments/[token]`. After a successful submit, the parent `station_picks.comment_used` SHALL be set to 1 atomically with the insert.

#### Scenario: First comment for a valid token
- **WHEN** a client posts `{ content: '<10 to 500 character message>', honeypot: '' }` to `/api/comments/<valid-unused-token>`
- **THEN** the server SHALL insert a row in `comments` with `pick_id` matching the token's pick, `station_id` denormalized from the pick, `content` trimmed, and `created_at` set to current unix milliseconds
- **AND** the matching `station_picks.comment_used` SHALL be updated from 0 to 1 in the same transaction
- **AND** the response status SHALL be 201

#### Scenario: Second comment for the same token
- **WHEN** a client posts to `/api/comments/<token>` whose `comment_used` is already 1
- **THEN** the response status SHALL be 409
- **AND** the response body SHALL include `{ error: 'token_used' }`
- **AND** no new comment row SHALL be inserted

#### Scenario: Unknown token
- **WHEN** a client posts to `/api/comments/<token>` where no `station_picks` row matches the token
- **THEN** the response status SHALL be 404
- **AND** the response body SHALL include `{ error: 'token_not_found' }`

#### Scenario: Honeypot is non-empty
- **WHEN** a client posts a comment with the `honeypot` field set to any non-empty string
- **THEN** the response status SHALL be 400
- **AND** no comment SHALL be inserted
- **AND** the matching `station_picks.comment_used` SHALL remain unchanged

#### Scenario: Content length out of bounds
- **WHEN** a client posts a comment whose trimmed content length is less than 10 or greater than 500 characters
- **THEN** the response status SHALL be 400
- **AND** no comment SHALL be inserted

### Requirement: Token validation endpoint reveals associated station
The `GET /api/comments/[token]` endpoint SHALL return the station context for a given token without requiring authentication, so the client comment form can display the station the user picked.

#### Scenario: Valid unused token
- **WHEN** a client calls `GET /api/comments/<token>` for a token whose `comment_used = 0`
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL include `{ station: { id, name_zh, transport_type, county? }, comment_used: 0 }`

#### Scenario: Valid already-used token
- **WHEN** a client calls `GET /api/comments/<token>` for a token whose `comment_used = 1`
- **THEN** the response body SHALL include `comment_used: 1`
- **AND** the response SHALL also include the station context so the client can display "this station already has your comment"

### Requirement: Public comments listing supports filter and pagination
The `GET /api/comments` endpoint SHALL return comments paginated by `created_at DESC`. It SHALL accept optional query parameters `transport_type`, `station_id`, `q` (full-text-like substring on content), `page` (default 1), `limit` (default 20, max 50).

#### Scenario: Default listing
- **WHEN** a client calls `GET /api/comments`
- **THEN** the response SHALL include `{ comments: [...], total, page: 1, total_pages }`
- **AND** `comments` SHALL be ordered by `created_at` descending
- **AND** the page size SHALL be 20

#### Scenario: Filter by transport_type
- **WHEN** a client calls `GET /api/comments?transport_type=tra`
- **THEN** the returned comments SHALL all belong to stations whose `transport_type = 'tra'`

#### Scenario: Filter by station
- **WHEN** a client calls `GET /api/comments?station_id=42`
- **THEN** the returned comments SHALL all have `station_id = 42`

#### Scenario: Limit clamping
- **WHEN** a client calls `GET /api/comments?limit=999`
- **THEN** the server SHALL clamp the page size to 50

### Requirement: Ranking endpoint aggregates pick counts across or per transport type
The `GET /api/stats` endpoint SHALL return a leaderboard of stations by pick count. It SHALL accept optional query parameters `transport_type` (omit for combined) and `limit` (default 50, max 200).

#### Scenario: Combined leaderboard
- **WHEN** a client calls `GET /api/stats`
- **THEN** the response SHALL include `{ rankings: [{ station_id, name_zh, transport_type, county, pick_count }, ...] }` ordered by `pick_count DESC, name_zh ASC`
- **AND** the rankings SHALL include both `mrt` and `tra` stations

#### Scenario: Filtered leaderboard
- **WHEN** a client calls `GET /api/stats?transport_type=mrt`
- **THEN** the rankings SHALL include only stations whose `transport_type = 'mrt'`

### Requirement: IP rate limiting for pick and comment with fixed time windows
The system SHALL enforce per-IP rate limits via the `rate_limits` table using fixed time windows. Pick scope SHALL allow at most 5 picks per minute per IP. Comment scope SHALL allow at most 10 comment submissions per hour per IP. The IP SHALL be determined in priority order: `cf-connecting-ip`, then first hop of `x-forwarded-for`, then the request socket address.

#### Scenario: Pick under the limit
- **WHEN** an IP has made 4 pick calls within the current minute window
- **AND** the same IP makes a 5th `POST /api/pick`
- **THEN** the call SHALL succeed
- **AND** the corresponding `rate_limits` row's `count` SHALL be incremented to 5

#### Scenario: Pick at the limit
- **WHEN** an IP has made 5 pick calls within the current minute window
- **AND** the same IP makes a 6th `POST /api/pick`
- **THEN** the response status SHALL be 429
- **AND** no new `station_picks` row SHALL be inserted

#### Scenario: Comment limit independent from pick
- **WHEN** an IP has hit the pick limit (5/minute)
- **AND** that IP has not yet submitted any comment in the current hour
- **THEN** a `POST /api/comments/[token]` from that IP SHALL still be allowed (subject only to the comment scope limit)

#### Scenario: Window rollover
- **WHEN** the wall-clock minute changes (window_start moves forward)
- **AND** the same IP makes a `POST /api/pick`
- **THEN** the call SHALL succeed against the new minute's window
- **AND** a new `rate_limits` row SHALL be created with `count = 1` for the new `window_start`

#### Scenario: IP unresolvable
- **WHEN** none of the headers `cf-connecting-ip`, `x-forwarded-for`, nor the socket address yield an IP
- **THEN** the rate limit SHALL apply against a shared `unknown` bucket
- **AND** the API SHALL still respond normally subject to that bucket's count

### Requirement: Station-scoped latest comment query path
The system SHALL support a dedicated read path that retrieves the single most recent comment for a given station id directly from the `comments` table using `station_id = ? ORDER BY created_at DESC LIMIT 1`. This path SHALL be exercised exclusively by the `GET /api/stations/[id]/latest-comment` endpoint defined in the `station-relay` capability and SHALL NOT alter any existing write or token-validation behaviour.

#### Scenario: Query isolation from existing comment list endpoint
- **WHEN** `GET /api/stations/[id]/latest-comment` is called
- **THEN** it SHALL NOT share implementation with or delegate to `GET /api/comments`
- **AND** no change to the behaviour of `GET /api/comments`, `POST /api/comments/[token]`, or `GET /api/comments/[token]` SHALL occur

### Requirement: Old rate-limit rows are pruned on each write
On every successful insert or update to `rate_limits`, the system SHALL delete rows whose `window_start` is older than two windows back for the corresponding scope, to prevent unbounded growth.

#### Scenario: Pruning during pick
- **WHEN** a `POST /api/pick` triggers a write to `rate_limits` for scope `pick`
- **THEN** the same statement batch SHALL also `DELETE FROM rate_limits WHERE scope = 'pick' AND window_start < <two_minutes_ago>`

#### Scenario: Pruning during comment
- **WHEN** a `POST /api/comments/[token]` triggers a write to `rate_limits` for scope `comment`
- **THEN** the same statement batch SHALL also `DELETE FROM rate_limits WHERE scope = 'comment' AND window_start < <two_hours_ago>`

### Requirement: Social nav lives in the top bar, not inside pickers
The entry points to the social surfaces (`/explore` for 旅人心得, `/stats` for 排行榜) SHALL be accessible from a persistent top-bar nav on every `(public)` route. The pickers (`MrtPicker`, `TraPicker`) and their sidebars SHALL NOT render their own `旅人心得` / `排行榜` links. The public top bar SHALL NOT contain a login entry; admin authentication lives at `/admin/login` and is not reachable from public navigation.

#### Scenario: Nav appears on picker page
- **WHEN** a visitor loads `/`
- **THEN** the top bar SHALL contain a text link to `/explore` labeled `旅人心得`
- **AND** a text link to `/stats` labeled `排行榜`

#### Scenario: Nav appears on community pages
- **WHEN** a visitor loads `/explore`, `/stats`, or `/comment`
- **THEN** the top bar SHALL show the same two entries
- **AND** the currently active entry (matching the route) SHALL receive a visible active-state indicator (`--accent` underline or equivalent, ≥2px, contrast ≥3:1)

#### Scenario: Picker sidebars no longer duplicate nav
- **WHEN** either picker (MRT or TRA) renders
- **THEN** its sidebar SHALL NOT contain any link to `/explore` or `/stats`
- **AND** the text "旅人心得" and "排行榜" SHALL NOT appear inside the picker sidebar

### Requirement: Result modal deep-links to station-scoped comments
After a successful pick, the result modal SHALL show a single contextual deep link for station-scoped 旅人心得 below the share action. The link SHALL adapt to the station's known comment count: when the count is `n ≥ 1` it SHALL read approximately "已有 n 位旅人抽到這站 · 看他們寫了什麼 →" and link to the station-filtered explore view; when the count is `0` (or unknown) it SHALL read "搶先留下這一站的心得 →" and link to the user's own comment form. The result modal SHALL NOT render a separate primary `留下心得` button alongside this deep link, since the deep link already covers both the contribute-first and read-others intents and a duplicated CTA on the reveal moment encourages low-quality pre-visit submissions.

#### Scenario: Modal shows count when available
- **WHEN** the result modal renders for a station whose server-provided comment count is `n ≥ 1`
- **THEN** the modal SHALL display a link that includes the number `n`
- **AND** the link SHALL navigate to `/explore?station_id=<id>` (or the equivalent station-filtered URL)

#### Scenario: Modal shows fallback copy on zero
- **WHEN** the result modal renders for a station whose server-provided comment count is `0`
- **THEN** the modal SHALL display a link with fallback copy containing the phrase "搶先"
- **AND** the link SHALL navigate to `/comment?token=<token>` (the user's own comment form)

#### Scenario: No redundant primary 留下心得 CTA
- **WHEN** the result modal renders for either an MRT or a TRA pick
- **THEN** the modal SHALL NOT render a primary button labeled "留下心得" alongside the deep link
- **AND** the only primary action below the station name SHALL be the share-ticket action (`曬出我的籤`)
- **AND** the contextual deep link SHALL remain the sole entry point into the comment flow from the result modal

### Requirement: Pick API returns a station comment count
The `POST /api/pick` response SHALL include a `comment_count` field reporting the number of `comments` rows currently associated with the resolved station. This SHALL be an O(1) lookup or a cheap aggregation; it SHALL NOT block the pick past 50ms under steady-state load.

#### Scenario: Response shape includes comment_count
- **WHEN** a client calls `POST /api/pick` with a valid body
- **THEN** the 200 response body SHALL include a `comment_count` field of type integer (≥0)
- **AND** `comment_count` SHALL equal the count of `comments` rows whose `station_id` matches the resolved station

#### Scenario: comment_count is zero for untouched stations
- **WHEN** a pick resolves to a station that has never received a comment
- **THEN** the `comment_count` field SHALL be exactly `0`

