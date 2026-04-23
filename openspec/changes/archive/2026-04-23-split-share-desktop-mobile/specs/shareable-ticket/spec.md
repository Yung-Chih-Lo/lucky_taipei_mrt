## MODIFIED Requirements

### Requirement: Result modal exposes a share action
The picker's result modal SHALL include a share action alongside the existing "留下心得" CTA. The action's behavior and label SHALL depend on whether the user's device is touch-capable:

- On touch-capable devices (`navigator.maxTouchPoints > 0`), the button SHALL be labeled "曬出我的籤" and activating it SHALL invoke the Web Share API with the generated ticket PNG.
- On non-touch devices (desktop), the button SHALL be labeled "複製籤紙圖片" and activating it SHALL write the ticket PNG to the system clipboard as a single `image/png` flavor, then show a confirmation toast.
- When neither path is available (missing API or runtime error that is not an `AbortError`), the app SHALL fall back to opening the ticket PNG URL in a new tab.

#### Scenario: Share button is present in modal
- **WHEN** the result modal opens after a successful pick
- **THEN** the modal SHALL contain a visible share/copy button
- **AND** the button SHALL be reachable with keyboard focus

#### Scenario: Touch device uses native share
- **WHEN** the user activates the button on a device where `navigator.maxTouchPoints > 0` AND the browser supports `navigator.share` with file support
- **THEN** the app SHALL be labeled "曬出我的籤"
- **AND** it SHALL call `navigator.share({ files: [<png>], title, text })` with the generated ticket PNG
- **AND** it SHALL NOT write to the system clipboard
- **AND** it SHALL NOT open a new tab as a fallback

#### Scenario: Desktop copies a single PNG to the clipboard
- **WHEN** the user activates the button on a device where `navigator.maxTouchPoints === 0` AND the browser supports `navigator.clipboard.write` with `ClipboardItem`
- **THEN** the button SHALL be labeled "複製籤紙圖片"
- **AND** the app SHALL call `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` with exactly one flavor
- **AND** the app SHALL show a visible confirmation (e.g. toast) that the image was copied
- **AND** it SHALL NOT call `navigator.share`

#### Scenario: Desktop paste targets receive exactly one image
- **WHEN** a desktop user has used the copy action and pastes into an application that inspects multiple clipboard flavors (e.g. Line Desktop, Notion)
- **THEN** exactly one ticket image SHALL be inserted into that application

#### Scenario: Fallback on unsupported browsers
- **WHEN** the selected path's API is unavailable (no `navigator.share`/`canShare` on touch, no `navigator.clipboard.write`/`ClipboardItem` on desktop), OR the call throws an error that is not an `AbortError`
- **THEN** the app SHALL open the ticket PNG URL in a new tab
- **AND** it SHALL provide a visible hint (e.g. copy text or keyboard instruction) for saving the image

#### Scenario: User cancels the native share sheet
- **WHEN** the user activates the button on a touch device and dismisses the share sheet, causing `navigator.share` to reject with an `AbortError`
- **THEN** the app SHALL NOT open a new tab
- **AND** the app SHALL NOT show an error toast
