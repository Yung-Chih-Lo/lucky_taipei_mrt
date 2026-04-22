## 1. API Endpoint

- [ ] 1.1 建立 `app/api/stations/[id]/latest-comment/route.ts`，查詢 `comments` table 取 `station_id = id ORDER BY created_at DESC LIMIT 1`
- [ ] 1.2 無心得時回傳 HTTP 204（空 body）；station 不存在時回傳 404
- [ ] 1.3 有心得時回傳 `{ excerpt: content.slice(0, 80) }`（HTTP 200）

## 2. MRT 結果頁

- [ ] 2.1 在 `ResultDisplay.tsx` 新增 `useEffect` fetch `latest-comment`，將結果存入 local state
- [ ] 2.2 在站名下方條件渲染 relay block（HTTP 204 或 fetch 失敗時不渲染）

## 3. TRA 結果頁

- [ ] 3.1 在 `TraResultDisplay.tsx` 同樣新增 fetch + state（複製 MRT 做法）
- [ ] 3.2 條件渲染 relay block，位置與 MRT 一致（站名下方）
