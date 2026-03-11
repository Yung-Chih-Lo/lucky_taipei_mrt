# Lucky Taipei MRT

台北捷運隨機站抽取器「坐火行」。選擇線路，隨機抽取下一站，附 Wikipedia 和 Google Maps 連結。

## 技術棧

- **Framework**: Next.js 15（App Router）
- **UI Library**: React 18
- **Styling**: styled-components 6（含 SSR registry）
- **Component Library**: Ant Design 5（含 Next.js registry 防 hydration 問題）
- **Linter**: ESLint（`next/core-web-vitals`）

## 常用指令

```bash
npm run dev      # 啟動開發伺服器（http://localhost:3000）
npm run build    # Production build
npm run lint     # 執行 ESLint 檢查
npm start        # 啟動 production 伺服器
```

## 專案結構

```
app/
  layout.jsx      # Root layout：metadata、SSR registry（styled-components + AntD）
  page.jsx        # 主頁面（App 邏輯、狀態管理）
  registry.jsx    # styled-components SSR registry
  globals.css     # 全域 reset 樣式

src/
  components/
    Sidebar.jsx       # 線路選擇側邊欄（Checkbox 列表）
    MetroMap.jsx      # SVG 捷運路網圖（選線 highlight/dim 效果）
    MetroStation.jsx  # 個別車站 SVG（單線圓形 / 轉乘弧形）
    ResultDisplay.jsx # 抽取結果 Modal（含動畫效果）
  constants/
    metroInfo.js      # 線路代碼、名稱、顏色定義（8 條線）
  utils/
    metroUtils.js     # getRandomMetroStation()：依選線過濾隨機抽站
  data/
    metroData.json    # 車站座標、連線路徑資料（靜態）

public/
  train.png           # Favicon
```

## 關鍵設計決策

- 所有 interactive components 需標記 `'use client'`（含 hooks 或事件 handler）
- `app/layout.jsx` 包裹 `StyledComponentsRegistry` 和 `AntdRegistry`，確保 SSR 不產生 hydration 警告
- `next.config.js` 啟用 `compiler.styledComponents: true` 讓 Next.js 編譯器處理 styled-components
- `metroData.json` 直接 import（靜態大型資料），無需 API route
- MetroMap 以 SVG viewBox `0 0 800 900` 渲染，`selectedLines` 控制透明度（dimOpacity = 0.25）

## 線路代碼對照

| 代碼 | 線路名稱 | 顏色 |
|------|---------|------|
| BR | 文湖線 | brown |
| R | 淡水信義線 | red |
| G | 松山新店線 | green |
| O | 中和新蘆線 | orange |
| BL | 板南線 | blue |
| Y | 環狀線 | #fadc00 |
| RA | 新北投支線 | pink |
| GA | 小碧潭支線 | #99E64D |
