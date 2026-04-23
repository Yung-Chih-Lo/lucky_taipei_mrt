## Why

Desktop Chromium browsers (Mac Edge, Chrome) route `navigator.share({ files, title, text })` through the OS share sheet, which on macOS populates the pasteboard with multiple flavors of the same image (PNG bytes + file promise URL). Target apps like Line and Notion iterate the pasteboard and paste each image-like flavor once, so users end up with two identical ticket images. The current single-code-path share button ships a mobile-first UX to desktop and produces a visible bug there.

## What Changes

- Split the share action into two code paths by platform:
  - **Mobile** (touch devices / Web Share API with file support makes sense): keep `navigator.share({ files, title, text })`. Button label remains "曬出我的籤".
  - **Desktop**: call `navigator.clipboard.write([ClipboardItem({ 'image/png': blob })])` to put a single PNG flavor on the clipboard. Button label becomes "複製籤紙圖片"; a toast confirms the copy.
- Fallback behavior (open PNG in new tab) remains for browsers that support neither path.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shareable-ticket`: the "Result modal exposes a share action" requirement splits into platform-specific sub-behaviors (native share for mobile, clipboard copy for desktop). Button label is no longer fixed to "曬出我的籤".

## Impact

- Code:
  - `components/omikuji/ShareableTicket.tsx`: platform detection, two handlers, dynamic button label.
- APIs / dependencies: none. `navigator.clipboard.write` + `ClipboardItem` are available in all current desktop Chromium/Firefox/Safari; no new deps.
- Specs: `openspec/specs/shareable-ticket/spec.md` (delta modifies the share-action requirement).
- No DB or image-generation changes; `/api/ticket/[token]` is untouched.
