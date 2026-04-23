## Context

使用者在抽到車站後（T+0）才會看到 token URL，但此時他們沒有動機留言（因為還沒去玩）。關掉頁面後 token 就消失，導致 UGC 轉換率接近零。

現有架構：
- Next.js 15，SQLite via `better-sqlite3`，無帳號系統
- 票券圖片由 `app/api/ticket/[token]/route.tsx` 透過 `@vercel/og` 生成
- QR code 使用 `qrcode` 套件，目前指向 `/ticket/{token}`（第 62 行）
- 留言頁在 `/comment?token={token}`
- 評論資料表 `comments`，欄位：`id, station_id, content, created_at`，透過 `station_picks` 取得 station_id

## Goals / Non-Goals

**Goals:**
- 讓使用者不依賴記住 URL 也能在旅遊後找回 token
- 在 T+0 就給使用者有價值的「讀」內容，提升結果頁的留存感
- 票券截圖本身成為回來留言的入口

**Non-Goals:**
- 帳號系統、跨裝置同步
- Email / LINE 召回（需外部依賴）
- 留言文字超過 50 字的 relay 顯示（避免劇透）

## Decisions

### 1. LocalStorage 作為 token 持久化方案（不是 email / cookie）

**決定**：pick 成功後在 `localStorage['pick_history']` 存 JSON array，上限 10 筆，用 `unshift` 保持最新在前。

**理由**：零後端成本，零外部依賴。覆蓋最常見情境（同一台手機回來）。換裝置失效是已知限制，但考量專案規模這是可接受的 trade-off。

**替代方案考慮**：
- Email：需 Resend/SendGrid + 排程 job，over-engineering
- Cookie：比 localStorage 更短命（Session cookie 關視窗就沒），persistent cookie 跨裝置一樣不行
- Server-side 用戶紀錄：需帳號系統，不在 scope

### 2. QR code target 改為留言頁（一行改動）

`app/api/ticket/[token]/route.tsx` 第 62 行：
```ts
// Before
const qrTarget = `${baseUrl}/ticket/${encodeURIComponent(pick.token)}`
// After
const qrTarget = `${baseUrl}/comment?token=${encodeURIComponent(pick.token)}`
```

**理由**：票券截圖已是使用者會存的東西，讓 QR code 直達留言頁，截圖即是鑰匙。`/ticket/{token}` 展示頁的功能不受影響（仍有路由），只是 QR code 不再指向它。

### 3. Station relay API：GET `/api/stations/[id]/relay`

回傳格式：`{ excerpt: string | null }`，`excerpt` 為最新一則留言的前 50 字（UTF-16 codeunit count）。無留言時回傳 `null`。

**理由**：獨立 endpoint 讓 ResultDisplay 可選擇性 fetch，不影響現有 pick API 的回應格式。用 SQLite 的 `LIMIT 1 ORDER BY created_at DESC` 取最新一則，效能無虞。

### 4. ResultDisplay 的 relay 顯示為 client-side fetch

ResultDisplay 目前是 client component（`'use client'`）。relay 資料在知道 station id 後用 `useEffect` fetch，loading 時不顯示（不影響畫面 layout）。

**理由**：不需要 SSR，避免讓 pick result 頁面多一個 waterfall。

## Risks / Trade-offs

- **LocalStorage 被清除** → 使用者找不回 token。無解，已接受。UI 上不應過度承諾「永久保存」。
- **跨裝置無法找回** → 已知限制，QR code on screenshot 是補充覆蓋方案。
- **relay 顯示過於劇透** → 只取前 50 字，且文案設計為「前人留下的一句話」而非「完整心得」。
- **relay API 回傳 null（無留言）** → ResultDisplay 靜默不顯示，不影響現有 UI。

## Migration Plan

1. 改 QR code target（1 行）→ 部署即生效，已有截圖的票券不受影響
2. 新增 relay API endpoint
3. ResultDisplay 加 relay 顯示
4. Picker 成功 callback 加 localStorage 寫入
5. 首頁加「我的抽籤紀錄」入口（純 client component）

無需 DB migration。無需 rollback strategy（所有改動都是 additive）。
