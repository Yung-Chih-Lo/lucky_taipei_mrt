## Why

使用者在抽到車站後（T+0）幾乎不可能馬上留心得，但 token URL 只出現在結果頁，關掉頁面後就無從找回，導致 UGC 大量流失。同時結果頁缺乏讓使用者在 T+0 就有動力「往下看」的內容鉤。

## What Changes

- **QR code 改指向留言頁**：ShareableTicket 票券圖片的 QR code 從 `/ticket/{token}` 改為 `/comment?token={token}`，讓分享出去的截圖成為回來留言的入口。
- **LocalStorage 抽籤歷史 + 首頁入口**：每次抽籤成功後將 `{ token, stationNameZh, pickedAt }` 存入 localStorage（上限 10 筆）；首頁加「我的抽籤紀錄」入口，列出歷史並直連留言頁。同時適用捷運與台鐵。
- **站站接龍**：結果頁顯示「上一個去過這站的旅人留下的一句話（取前 50 字）」，製造 T+0 的讀取動機與旅遊後的「傳接力棒」寫作動機。需新增 API endpoint 取得某站最新一則留言摘要。

## Capabilities

### New Capabilities

- `pick-history`: 在 localStorage 儲存使用者抽籤歷史，並在首頁顯示歷史入口讓使用者找回 token
- `station-relay`: 結果頁顯示該站最近一則旅人心得的摘要（前 50 字），形成「站站接龍」閱讀動線

### Modified Capabilities

- `shareable-ticket`: QR code 目標從展示頁改為留言頁

## Impact

- `components/omikuji/ShareableTicket.tsx`（或類似路徑）：修改 QR code target URL
- `app/api/ticket/[token]/route.tsx`：可能包含 QR code 產生邏輯，需確認
- MRT picker / TRA picker 的 pick 成功 callback：寫入 localStorage
- 首頁元件（捷運、台鐵）：新增歷史入口 UI
- `app/api/stations/[id]/relay/route.ts`（新增）：回傳該站最新留言前 50 字
- `components/ResultDisplay.tsx`、`components/tra/ResultDisplay.tsx`：顯示站站接龍內容
