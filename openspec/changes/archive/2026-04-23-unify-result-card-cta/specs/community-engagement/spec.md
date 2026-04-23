## MODIFIED Requirements

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
