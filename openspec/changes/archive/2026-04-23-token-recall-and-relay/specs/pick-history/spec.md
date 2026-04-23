## ADDED Requirements

### Requirement: Pick result is persisted to localStorage on success
每次抽籤成功後，系統 SHALL 將 `{ token: string, stationNameZh: string, pickedAt: number }` 寫入 `localStorage['pick_history']`（JSON array）。新紀錄 SHALL 插入陣列最前方（unshift）。陣列 SHALL 最多保留 10 筆，超過時裁切最舊的。此行為 SHALL 同時適用於捷運與台鐵兩個 picker。

#### Scenario: First pick is stored
- **WHEN** 使用者成功抽到一個車站（捷運或台鐵），且 `pick_history` 尚不存在或為空
- **THEN** `localStorage['pick_history']` SHALL 包含一筆紀錄
- **AND** 該紀錄的 `token` SHALL 等於本次抽籤回傳的 token
- **AND** 該紀錄的 `stationNameZh` SHALL 等於抽到的車站中文名稱
- **AND** 該紀錄的 `pickedAt` SHALL 為一個合理的 Unix timestamp（ms）

#### Scenario: Second pick is prepended
- **WHEN** 使用者再次成功抽籤
- **THEN** `localStorage['pick_history']` SHALL 包含 2 筆紀錄
- **AND** 最新的抽籤紀錄 SHALL 在 index 0

#### Scenario: History is capped at 10
- **WHEN** `pick_history` 已有 10 筆紀錄，使用者再次成功抽籤
- **THEN** `localStorage['pick_history']` SHALL 仍包含 10 筆紀錄
- **AND** 最舊的紀錄 SHALL 被移除

#### Scenario: localStorage write failure is silently ignored
- **WHEN** localStorage 不可用（例如 private browsing 禁止存取）
- **THEN** 抽籤結果頁 SHALL 正常顯示，不應拋出錯誤或顯示警示

### Requirement: Homepage exposes a pick history drawer/section
首頁（捷運與台鐵各自的首頁）SHALL 在有歷史紀錄時顯示一個「我的抽籤紀錄」入口。點擊後 SHALL 展開或跳轉至歷史列表，每筆顯示車站名稱、抽籤時間，並提供直連 `/comment?token={token}` 的連結。無歷史時入口 SHALL 不顯示。

#### Scenario: Entry point is hidden when history is empty
- **WHEN** 使用者首次進入首頁，`pick_history` 不存在或為空
- **THEN** 頁面 SHALL NOT 顯示「我的抽籤紀錄」入口

#### Scenario: Entry point appears after a pick
- **WHEN** 使用者成功抽籤後回到首頁
- **THEN** 頁面 SHALL 顯示「我的抽籤紀錄」入口
- **AND** 入口顯示最近抽到的車站名稱或紀錄數量

#### Scenario: Each history item links to comment page
- **WHEN** 使用者點開歷史列表，點擊某一筆紀錄
- **THEN** 瀏覽器 SHALL 導向 `/comment?token={該筆紀錄的 token}`
