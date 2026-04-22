## Why

結果頁目前沒有「讀的動機」——使用者抽到一站後，除了 Wikipedia 和 Google Maps，沒有任何理由在站內繼續探索。同時，「留下心得」的按鈕對剛抽到站、還沒去玩的使用者沒有意義，導致 UGC 回寫率極低。透過在結果頁展示上一位旅人留下的一句話，製造「我想知道前人留了什麼」的讀動機，以及「我也要給下一個人留一句話」的寫動機，像廟籤傳遞籤詩一樣的接力感。

## What Changes

- 結果頁（MRT `ResultDisplay` 和 TRA `TraResultDisplay`）新增一個「前旅人留言」區塊，顯示該站最新一則心得的前段文字
- 新增 API endpoint `GET /api/stations/[id]/latest-comment`，回傳該站最新一則 comment 的內容（不含個人資訊）
- 若該站目前沒有任何心得，此區塊不顯示（不用 placeholder 佔位）

## Capabilities

### New Capabilities
- `station-relay`: 在結果頁顯示該站最新一則旅人心得，作為讀寫雙向的社群接力入口

### Modified Capabilities
- `community-engagement`: 新增按 station 查詢最新心得的查詢路徑（不改變現有寫入或 token 邏輯）

## Impact

- `components/ResultDisplay.tsx`（MRT 結果頁）
- `components/tra/ResultDisplay.tsx`（TRA 結果頁）
- 新增 `app/api/stations/[id]/latest-comment/route.ts`
- DB 讀取 `comments` table，按 `station_id` + `created_at DESC LIMIT 1`，無 schema 變更
