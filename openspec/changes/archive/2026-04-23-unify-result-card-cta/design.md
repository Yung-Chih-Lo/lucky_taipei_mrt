## Context

The result modal that follows a successful pick has drifted between transport modes:

- `components/ResultDisplay.tsx` (MRT) — primary action is `ShareableTicket`; comment entry is the bottom contextual deep link only.
- `components/tra/ResultDisplay.tsx` (TRA) — adds a primary `<Button type="primary">留下心得</Button>` above `ShareableTicket`, then ALSO renders the same bottom contextual deep link, which on a 0-comment station points to the same `/comment?token=...` URL as the primary button.

So TRA has two CTAs pointing at the same destination, and MRT has zero primary 留下心得 entry. The current `community-engagement` spec ("留下心得 remains present") codified the TRA shape as canonical, which made MRT non-conforming.

A four-perspective exploration (UX, growth, behavioral psychology, IA) converged on the same recommendation: surface only the share action as primary at reveal time, and let the contextual deep link own both "be the first to write" and "see what others wrote" depending on `comment_count`.

## Goals / Non-Goals

**Goals:**
- TRA and MRT result modals expose the same action set.
- The reveal moment promotes share (high-intent at that moment) and de-promotes a pre-visit "留下心得" prompt that produces low-value content.
- Spec language reflects the new shape, so future drift is caught.

**Non-Goals:**
- Redesigning `ShareableTicket`, the bottom deep link copy, or the `/comment` page itself.
- Building any post-visit recall mechanism (email/LINE reminder, return-visit prompt). These came up as stronger triggers in exploration but are out of scope.
- Touching the pick API, `comment_count` plumbing, or `/explore`/`/stats` routes.

## Decisions

**Decision 1 — Remove TRA's primary `留下心得` button instead of adding one to MRT.**
Alternatives considered:
- _Add the button to MRT for consistency._ Rejected: this propagates the same semantic mismatch (asking for a "心得" before the user has visited) and dilutes UGC quality. The bottom deep link already provides a comment entry on 0-comment stations.
- _Keep both but rename the primary on TRA to differentiate intent (e.g., "預約留心得")._ Rejected: it's a workaround for redundancy that adds copywriting load and still pushes a pre-visit submission.

**Decision 2 — Keep the bottom contextual deep link unchanged.**
It already does the right thing: pulls the user toward existing UGC when `n ≥ 1`, and toward contributing when `n = 0`. The four-agent IA review flagged that "consume vs contribute" is technically two intents collapsed into one slot, but splitting it is polish and not required for this change.

**Decision 3 — Spec change is a MODIFIED requirement, not a new one.**
The existing requirement "Result modal deep-links to station-scoped comments" already governs this surface; we reword the requirement and replace the "留下心得 remains present" scenario with its inverse. This keeps the spec history coherent and avoids creating a parallel requirement that contradicts the old one.

## Risks / Trade-offs

- **[Risk] Removing a primary CTA may reduce raw `/comment` click-through on TRA.** → Mitigation: the bottom deep link still routes to `/comment?token=...` whenever `comment_count = 0`, so the path is preserved for users who actively want to write. Lost clicks were disproportionately likely to be low-quality pre-visit submissions.
- **[Risk] Visual hierarchy of TRA modal changes — `ShareableTicket` becomes the lone primary action and the modal shortens.** → Mitigation: this matches MRT today, which has shipped without complaint; no new styles required.
- **[Trade-off] We are not building the stronger post-visit recall trigger that exploration identified as the right home for "留下心得".** Accepted: smallest viable change first; recall mechanism is a separate, larger initiative.

## Migration Plan

1. Edit `components/tra/ResultDisplay.tsx`: remove the `<Link>` block wrapping the `<Button type="primary">留下心得</Button>`, drop the `Button` and `MessageOutlined` imports if unused after removal, and drop the `commentLink` local if unused after removal.
2. Update `openspec/specs/community-engagement/spec.md` via the standard archive flow once the change is applied — no runtime migration, no data backfill.
3. Rollback is a one-file revert; no schema, API, or persisted state is touched.
