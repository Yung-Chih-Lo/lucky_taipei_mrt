## 1. Platform detection

- [x] 1.1 In `components/omikuji/ShareableTicket.tsx`, add an `isTouch` state initialized to `null`.
- [x] 1.2 In a `useEffect` with empty deps, set `isTouch` to `typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0` so the read happens only after mount (avoid SSR mismatch).

## 2. Split the share handler

- [x] 2.1 Extract the existing `navigator.share({ files, title, text })` flow into a `handleMobileShare` function; keep the `AbortError` and non-abort fallback branches as-is.
- [x] 2.2 Add a `handleDesktopCopy` function that fetches the PNG, constructs a `new ClipboardItem({ 'image/png': blob })`, calls `navigator.clipboard.write([item])`, and shows `message.success('已複製籤紙圖片，貼到 Line / Notion 即可分享')`.
- [x] 2.3 In `handleDesktopCopy`, guard the call: if `navigator.clipboard?.write` or `window.ClipboardItem` is missing, OR the call throws, fall back to `window.open(pngUrl, '_blank', 'noopener,noreferrer')` with the existing `message.info('長按圖片儲存或分享')` hint.
- [x] 2.4 Make the button's `onClick` branch on `isTouch`: call `handleMobileShare` when true, `handleDesktopCopy` when false. While `isTouch === null` (pre-mount), default to `handleMobileShare` so the button label and the handler match.

## 3. Button label

- [x] 3.1 Derive `buttonLabel` from `isTouch`: `'曬出我的籤'` when true or null, `'複製籤紙圖片'` when false.
- [x] 3.2 Replace the hard-coded `"曬出我的籤"` children with `{buttonLabel}`.

## 4. Tests

- [x] 4.1 Add a unit test (vitest + jsdom) for `ShareableTicket` that stubs `navigator.maxTouchPoints = 0`, `navigator.clipboard.write`, and `window.ClipboardItem`, clicks the button, and asserts `clipboard.write` is called exactly once with one `ClipboardItem` carrying a single `image/png` entry.
- [x] 4.2 Add a unit test that stubs `navigator.maxTouchPoints = 1` and `navigator.share`/`navigator.canShare`, clicks the button, and asserts `navigator.share` is called once with `files: [<File>]`.
- [x] 4.3 Add a regression test: on desktop path, assert `navigator.share` is NOT called — this is the test that would have caught the two-image bug in principle. (Folded into 4.1.)
- [x] 4.4 Add a fallback test: on desktop, if `navigator.clipboard.write` throws, assert `window.open` is called once with the ticket PNG URL.

## 5. Manual verification

- [x] 5.1 On Mac Edge, click the button, paste into Line Desktop → exactly one image appears.
- [x] 5.2 On Mac Edge, paste into Notion → exactly one image appears.
- [x] 5.3 On iOS Safari, tap the button → native share sheet opens with the PNG and text.
- [x] 5.4 In a browser with `navigator.clipboard.write` disabled (or via feature stub), verify the fallback opens the PNG in a new tab.
