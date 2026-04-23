## Why

票券圖片上的 `No.XXXX` 目前是 token hash 產生的假號碼，對使用者毫無意義。改成全站累積抽籤序號後，每個人都能知道自己是第幾位來抽的旅人，低號碼具有早鳥榮耀感，也讓 No. 成為真實的社群溫度計。

## What Changes

- `station_picks` 表加入 `pick_no INTEGER` 欄位，在每次 INSERT 時寫入當下的全站累積序號（`SELECT COUNT(*) + 1` 或 `MAX(pick_no) + 1`）
- `ticketNoFromToken()` 廢棄，改由資料庫讀取 `pick_no`
- `/api/ticket/[token]/route.tsx` 改用 `pick.pick_no` 格式化籤號
- `ResultDisplay` 與 `TraResultDisplay` 若顯示籤號，也改用真實序號（透過 token 查詢時已包含於 pick row）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `shareable-ticket`：籤號 `No.XXXX` 的來源從 token hash 改為資料庫全站累積序號；格式改為至少 4 位補零，超過 9999 後自然延伸（不截斷）

## Impact

- `db/migrations/` 或 `db/schema`：`station_picks` 加 `pick_no` 欄位（含 backfill，以 `rowid` 順序補值）
- MRT picker / TRA picker 的 pick API route（`/api/mrt/pick` 等）：INSERT 時計算並寫入 `pick_no`
- `lib/ticketNumber.ts`：`ticketNoFromToken` 可刪除或保留為 fallback
- `app/api/ticket/[token]/route.tsx`：改用 `pick.pick_no`
- `components/ResultDisplay.tsx`、`components/tra/ResultDisplay.tsx`：如顯示序號，改用 API 回傳的真實值
