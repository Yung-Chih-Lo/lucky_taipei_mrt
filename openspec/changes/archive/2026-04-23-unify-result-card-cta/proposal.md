## Why

The TRA result modal exposes two CTAs that point to the same `/comment?token=...` destination — a primary `留下心得` button and a secondary `搶先留下這一站的心得 →` link — while the MRT result modal only shows the secondary link. Beyond the inconsistency, surfacing `留下心得` as a primary CTA in the moment of reveal is semantically off (the user has not yet visited the station) and risks polluting the UGC pool with empty "looking forward to it" entries that dilute genuine post-visit reviews.

## What Changes

- Remove the primary `留下心得` button from `TraResultDisplay` so both modes show the same action set.
- Promote `ShareableTicket` to the only primary action in both `ResultDisplay` (MRT) and `TraResultDisplay`.
- Keep the existing bottom contextual link (`搶先留下這一站的心得 →` / `已有 N 位旅人...`) unchanged in both modes.
- **BREAKING** for the spec only: the `community-engagement` requirement currently mandates that the primary `留下心得` CTA remain present in the result modal; this is being inverted.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `community-engagement`: the "Result modal deep-links to station-scoped comments" requirement is reworded to forbid a redundant primary `留下心得` CTA on the result modal, since the contextual deep link already covers both intents (write-first vs. read-others).

## Impact

- `components/tra/ResultDisplay.tsx`: remove the `<Button type="primary">留下心得</Button>` block and its `MessageOutlined` import; remove the now-unused `commentLink` local if no longer referenced.
- `components/ResultDisplay.tsx` (MRT): unchanged.
- `openspec/specs/community-engagement/spec.md`: scenario "留下心得 remains present" replaced.
- No API, schema, or data changes.
