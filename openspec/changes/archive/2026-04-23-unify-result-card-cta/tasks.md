## 1. Remove redundant TRA primary CTA

- [x] 1.1 In `components/tra/ResultDisplay.tsx`, delete the `<Link href={commentLink}>...<Button type="primary" ... icon={<MessageOutlined />}>留下心得</Button>...</Link>` block that sits between the `linksRow` and the `ShareableTicket`.
- [x] 1.2 Remove the `Button` import from `'antd'` and the `MessageOutlined` import from `'@ant-design/icons'` if no other usage remains in the file.
- [x] 1.3 Keep the `commentLink` local constant — after step 1.1 it remains referenced by the bottom deep link's 0-comment branch.

## 2. Verify visual parity

- [x] 2.1 Run `npm run dev` and trigger a TRA pick; confirm the result modal now shows: station block → 維基/Maps → ShareableTicket → bottom deep link (no `留下心得` button between them).
- [x] 2.2 Trigger an MRT pick on the same dev server; confirm `ResultDisplay.tsx` is unchanged (still: station block → 維基/Maps → ShareableTicket → bottom deep link).
- [x] 2.3 Confirm the bottom deep link in TRA still flips between `搶先留下這一站的心得 →` (when `commentCount === 0`) and `已有 N 位旅人抽到這站 · 看他們寫了什麼 →` (when `commentCount > 0`).

## 3. Validate change artifacts

- [x] 3.1 Run `openspec validate unify-result-card-cta --strict` and resolve any reported issues.
- [x] 3.2 Run `npx tsc --noEmit` (project has no configured `next lint`) to confirm no unused-import or dead-variable errors remain in `components/tra/ResultDisplay.tsx`.
