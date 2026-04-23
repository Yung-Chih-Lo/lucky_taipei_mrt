## 1. 更新票券圖片 API

- [ ] 1.1 在 `/api/ticket/[token]/route.tsx` 的 SQL query 加入 `p.id` 欄位
- [ ] 1.2 以 `String(pick.id).padStart(4, '0')` 取代 `ticketNoFromToken(pick.token)` 計算籤號
- [ ] 1.3 刪除 `import { ticketNoFromToken }` 這行

## 2. 清除廢棄程式碼

- [ ] 2.1 刪除 `lib/ticketNumber.ts` 的 `ticketNoFromToken` function（或整個檔案，若 `formatPickDate` 也已無用）
- [ ] 2.2 確認沒有其他地方 import `ticketNoFromToken`
