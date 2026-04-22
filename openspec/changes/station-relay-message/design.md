## Context

結果頁（MRT `ResultDisplay` / TRA `TraResultDisplay`）目前只在有心得時顯示「已有 X 位旅人抽到這站」的計數連結。使用者抽到站後沒有理由在站內停留，也沒有動機事後回來留言。

新功能在結果頁顯示該站最新一則心得，讓每位抽到這站的使用者都看到前任旅人的一句話，形成「接力棒」感。

現有 `comments` table 已有 `station_id` 欄位可直接查詢，無需 schema 變更。

## Goals / Non-Goals

**Goals:**
- 結果頁（MRT + TRA 共兩個）顯示該站最新一則心得的截短文字
- 新 API endpoint 回傳最新心得
- 沒有心得時 UI 靜默不顯示（無 skeleton / placeholder）

**Non-Goals:**
- 顯示多則心得或分頁
- 顯示心得作者資訊（匿名設計不變）
- 快取或 CDN 層（查詢單列，DB 足夠快）

## Decisions

### 決策 1：新增獨立 endpoint，不複用 `/api/comments`
`GET /api/stations/[id]/latest-comment` 單一職責：回傳最新一則，格式簡單。
備選：複用 `GET /api/comments?station_id=X&limit=1`——但這會在結果頁暴露完整留言列表的 shape，未來欄位若有調整容易產生意外耦合。

### 決策 2：內容截短在 server 端
API 回傳最多 80 字的 `excerpt` 欄位（由 server trim），client 不做截短邏輯。
理由：之後若要調整截短長度，改一個地方即可。

### 決策 3：無心得時 HTTP 204，client 靜默
回傳 204 No Content，UI 不渲染區塊，不顯示「還沒有心得」等文字。
理由：冷啟動時大多數站沒有心得，空狀態文字會製造錯誤期待。

### 決策 4：以 `created_at DESC LIMIT 1` 取最新
不做熱度排序，純粹最新。理由：「接力棒」語意強調時序連續性，最新的旅人留下的話是傳給下一個人的。

## Risks / Trade-offs

- **[風險] 心得品質不穩定** → 只顯示截短的 80 字，極端情況下（如垃圾留言）影響有限；後台已有管理介面可刪除
- **[Trade-off] 不顯示發言時間** → 使用者無法判斷這則心得有多舊，可能是幾年前的。目前接受，未來可加「X 天前」相對時間

## Open Questions

- 截短長度 80 字是否合適？（日後可透過改 server 常數調整，不影響 spec）
