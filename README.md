# 坐火行 (chò-hué kiânn) 🚆

## 專案概述 (Project Overview)

不知道今天去哪？選幾條路線，讓命運決定你的下一站。

「坐火行」是一個隨機抽站應用程式，支援**台北捷運**與**台鐵**。勾選想搭的路線，按下「命．中．注．定」，就出發吧。

## 功能特色 (Features)

- **🗺️ 捷運路線篩選**：以路線 Checkbox 選取想包含的捷運路線，色票對應官方路線顏色。
- **🎯 隨機抽取站點**：從勾選路線中隨機抽出一個車站作為目的地。
- **✨ 抽取動畫**：按下按鈕後有一段站名快速跳動的動畫，增加儀式感。
- **📍 站點資訊連結**：結果顯示後提供維基百科與 Google Map 連結，方便直接規劃行程。
- **🚂 台鐵支援**：也支援依縣市篩選台鐵車站並隨機抽取。
- **📱 響應式設計**：手機版自動調整佈局，捷運路線清單與地圖垂直堆疊。
- **🖼️ 截圖分享**：可將抽取結果截圖儲存。

## 安裝與設定 (Installation & Setup)

專案為 Next.js 15 App Router + SQLite (Drizzle ORM)。本地跑需要 Node.js 20。

1. **複製儲存庫**
   ```bash
   git clone https://github.com/Yung-Chih-Lo/lucky_station_new.git
   cd lucky_taipei_mrt
   npm install
   ```

2. **設定環境變數**：建 `.env.local`
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=<run: npm run hash-password -- 'your_pw'>
   SESSION_SECRET=<run: openssl rand -base64 48>
   DATABASE_PATH=./data/metro.db
   ```

3. **初始化資料庫（第一次才需要）**
   ```bash
   npm run migrate   # 建表
   npm run seed      # 從 scripts/seed-data/ 灌入捷運與台鐵資料
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
   打開 `http://localhost:3000`（公開頁）或 `http://localhost:3000/admin`（後台）。

### 部署 (Docker)

正式部署用 repo 根的 `Dockerfile`。entrypoint 會自動 `migrate` + 幂等 `seed` 後啟動 Next.js，所以掛 volume 到 `/data` 就能讓資料跨重 build 保留。

## 致謝

react-svg-map: https://github.com/VictorCazanave/svg-maps?tab=readme-ov-file

## 如何貢獻 (Contributing)

歡迎提交 [Issue](https://github.com/Yung-Chih-Lo/lucky_station_new/issues) 或發起 [Pull Request](https://github.com/Yung-Chih-Lo/lucky_station_new/pulls)。
