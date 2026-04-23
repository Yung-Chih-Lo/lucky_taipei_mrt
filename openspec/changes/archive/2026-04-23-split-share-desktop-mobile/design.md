## Context

`ShareableTicket` (`components/omikuji/ShareableTicket.tsx`) currently branches only on "does this browser have `navigator.share` + `navigator.canShare` with file support?". On desktop Chromium (Mac Edge, Chrome) that check passes, so we call `navigator.share({ files: [png], title, text })`. macOS then routes through NSSharingService, and when the user picks "Copy", the pasteboard receives multiple representations of the same image (PNG bytes, file-promise URL, etc.). Paste targets like Line Desktop and Notion iterate every image-like flavor and insert each one, so the user sees two identical images.

Web Share API is the right UX on touch devices (iOS/Android present an app-picker sheet). On desktop, where "share" in practice means "paste it into another app", a direct clipboard write gives one clean flavor and bypasses the OS share sheet entirely.

## Goals / Non-Goals

**Goals:**
- Desktop users get exactly one PNG on the clipboard when they click the share action.
- Mobile users keep the current `navigator.share` flow unchanged.
- Button label matches the action the user will actually get (share vs. copy).
- No new runtime dependencies.

**Non-Goals:**
- Changing the generated ticket image, its API route, or caching behavior.
- Supporting ancient browsers that lack both `navigator.share` and `navigator.clipboard.write`. Existing fallback (open PNG in new tab) covers them.
- Adding a "Download PNG" button, share-to-social-media integrations, or analytics.
- Unifying the two `ResultDisplay` components (MRT + TRA) — both just render `<ShareableTicket>` and inherit the fix.

## Decisions

### Decision 1: Platform detection — touch-capable vs. not

Use `navigator.maxTouchPoints > 0` (with a `typeof navigator !== 'undefined'` guard for SSR) to decide which path to take.

- **Why this over user-agent sniffing**: UA strings are unreliable and Edge/Chrome on Windows touchscreens are ambiguous; `maxTouchPoints` directly answers "does this device have a touch digitizer", which correlates with "does the OS share sheet make sense here". An iPad in desktop-mode Safari still reports touch points.
- **Why this over `'ontouchstart' in window`**: both work, but `maxTouchPoints` is the spec-preferred signal and doesn't rely on an event existing on `window`.
- **Alternative considered — feature-detect Clipboard API**: rejected because mobile Chromium also supports `navigator.clipboard.write`, so feature-detection alone wouldn't route mobile users to `navigator.share`.

Edge case: a Windows laptop with a touchscreen will be treated as mobile and hit `navigator.share`. That's acceptable — desktop Chromium on Windows has the same multi-flavor issue, but the population is small and the mobile path still works there (OS share sheet appears).

### Decision 2: Desktop handler uses `navigator.clipboard.write` with a single `image/png` flavor

```
const blob = await (await fetch(pngUrl)).blob()
await navigator.clipboard.write([
  new ClipboardItem({ 'image/png': blob }),
])
messageApi.success('已複製籤紙圖片，貼到 Line / Instagram 即可分享')
```

- **Why a single flavor**: the whole point is to stop giving the OS multiple representations. One `image/png` entry is what Line Desktop and Notion paste cleanly.
- **Why not `ClipboardItem({ 'image/png': Promise<Blob> })` lazy form**: supported, but eager is simpler and the PNG is already fetched.
- **Alternative considered — keep `navigator.share` but strip `title`/`text`**: may reduce the duplication (the title/text adds another pasteboard flavor) but doesn't fully fix the image multi-flavor issue, and we lose control of what OS sticks on the pasteboard.

### Decision 3: Button label is derived from the chosen path, not a prop

- Mobile path → "曬出我的籤" (unchanged).
- Desktop path → "複製籤紙圖片".
- Compute once at render time after the `useEffect` that reads `navigator.maxTouchPoints` (to avoid SSR/CSR mismatch, since `navigator` is undefined on the server).

### Decision 4: Fallback remains `window.open(pngUrl, '_blank')`

Triggered when:
- Mobile path: `navigator.share`/`canShare` missing, OR the `fetch` fails, OR the share call throws a non-`AbortError`.
- Desktop path: `navigator.clipboard.write` or `ClipboardItem` missing, OR the clipboard call throws (e.g., permission denied in some hardened contexts).

No change to the existing fallback UX.

## Risks / Trade-offs

- **[Risk] Clipboard write requires a user gesture and a secure context.** → The call is in an `onClick` handler so we have a gesture; production is HTTPS so secure context holds. Localhost is also a secure context for clipboard purposes. Permissions prompt on Firefox desktop may appear — acceptable.
- **[Risk] User on a touchscreen laptop gets the mobile share flow and sees the two-image bug in some target apps.** → Mitigation: accept as a known edge case; the bug is less severe than the current state (which affects 100% of desktop users) and this population is small. If it becomes a real complaint, revisit with explicit UA heuristics.
- **[Trade-off] Two button labels split the brand voice.** → Acceptable: "複製籤紙圖片" is functional and honest about what happens; mobile retains the playful "曬出我的籤".
- **[Risk] SSR hydration mismatch if we read `navigator` during render.** → Read `navigator.maxTouchPoints` inside `useEffect` (mount-only), keep an `isTouch` state initialized to `null`, and render a neutral loading-safe default label (e.g., mobile label) until mount. This matches how the existing component already uses `useState` for `isSharing`.

## Migration Plan

1. Ship the updated `ShareableTicket` component.
2. No data, URL, or API migration needed; no feature flag.
3. Rollback: revert the single component file.

## Open Questions

None — the shape is small enough that the decisions above cover it.
