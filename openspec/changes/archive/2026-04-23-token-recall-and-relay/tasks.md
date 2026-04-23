## 1. QR Code 改指向留言頁

- [x] 1.1 修改 `app/api/ticket/[token]/route.tsx` 第 62 行，將 `qrTarget` 從 `/ticket/{token}` 改為 `/comment?token={token}`
- [x] 1.2 更新 `openspec/specs/shareable-ticket/spec.md` 中 QR code scenario 的描述（確認與 delta spec 一致）

## 2. Relay API

- [x] 2.1 新增 `app/api/stations/[id]/relay/route.ts`，實作 `GET` handler：查詢 `comments` 表取該 station_id 最新一則留言，回傳 `{ excerpt: string | null }`（前 50 字元，超過加 `…`）
- [x] 2.2 若 station_id 不存在於 `stations` 表，回傳 404

## 3. ResultDisplay 顯示 Relay

- [x] 3.1 修改 `components/ResultDisplay.tsx`（捷運），在 station id 已知後 `useEffect` fetch `/api/stations/{id}/relay`，若 excerpt 存在則在結果頁顯示「上一個旅人說：{excerpt}」區塊
- [x] 3.2 修改 `components/tra/ResultDisplay.tsx`（台鐵），相同邏輯
- [x] 3.3 確認 fetch 失敗或 excerpt 為 null 時，relay 區塊靜默不顯示，不影響現有 UI 佈局

## 4. LocalStorage 抽籤歷史寫入

- [x] 4.1 在捷運 picker 的成功 callback（pick 回應成功後）加入 localStorage 寫入邏輯：`unshift({ token, stationNameZh, pickedAt: Date.now() })`，保留最多 10 筆
- [x] 4.2 在台鐵 picker（`components/tra/TraPicker.tsx`）的成功 callback 加入相同邏輯
- [x] 4.3 確認 localStorage 不可用時（try/catch）靜默略過，不影響抽籤結果顯示

## 5. 首頁「我的抽籤紀錄」入口

- [x] 5.1 新增 client component `components/PickHistory.tsx`：從 localStorage 讀取 `pick_history`，若有資料則渲染歷史列表，每筆顯示車站名稱、抽籤時間，連結到 `/comment?token={token}`
- [x] 5.2 將 `PickHistory` 嵌入捷運首頁適當位置（有資料時才顯示）
- [x] 5.3 將 `PickHistory` 嵌入台鐵首頁適當位置（有資料時才顯示）
