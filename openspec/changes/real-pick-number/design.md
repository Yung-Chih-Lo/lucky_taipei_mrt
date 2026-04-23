## Context

`station_picks` 已有 `id INTEGER PRIMARY KEY AUTOINCREMENT`，SQLite autoincrement ID 在沒有刪除 row 的情況下等同全站累積序號。目前 `/api/ticket/[token]/route.tsx` 用 `ticketNoFromToken(token)` 把 token hash 轉成假的 4 位數，完全沒用到 `id`。

## Goals / Non-Goals

**Goals:**
- 票券圖片的 `No.XXXX` 顯示真實的全站抽籤累積序號
- 不動 DB schema（直接用 `station_picks.id`）
- 刪除無用的 `ticketNoFromToken` 函式

**Non-Goals:**
- 補 backfill 編號（舊資料的 `id` 本就是連續的，直接用即可）
- 在 ResultDisplay 頁面額外顯示序號（目前 ResultDisplay 沒有顯示 No.）
- 每站獨立計數

## Decisions

### 直接用 `station_picks.id` 作為籤號

`id AUTOINCREMENT` 對 SQLite 的保證：不重複、遞增、不跳號（只要不刪行）。我們從不刪 pick，所以 `id` === 全站第 N 次抽。

替代方案「加 `pick_no` 欄位在 INSERT 時寫入 `MAX(pick_no)+1`」有 race condition 風險（並發時可能重複），且需要 migration。直接用 `id` 更簡單安全。

### 格式：`padStart(4, '0')`，不截斷

`String(id).padStart(4, '0')`：1–9999 顯示 4 位，之後自然延伸。不用 `% 10000`，避免號碼循環失去意義。

### 刪除 `ticketNoFromToken`

只有 `/api/ticket/[token]/route.tsx` 用到，刪除後不留 fallback。

## Risks / Trade-offs

- **SQLite 刪行後 ID 跳號** → 我們沒有刪 pick 的機制，風險為零
- **ID 被反推使用量** → 本身就是設計意圖（讓用戶感受到社群溫度），可接受
- **超過 9999 後不補零至 5 位** → 格式自然延伸，ticket 版面能承受 5-6 位數字

## Migration Plan

無需 DB migration。純 code change：
1. 更新 `/api/ticket/[token]/route.tsx` SELECT 時已含 `id`，直接讀取
2. 刪除 `lib/ticketNumber.ts` 或移除 `ticketNoFromToken` 的 export 與使用
3. 同時刪除 `route.tsx` 裡的 import
