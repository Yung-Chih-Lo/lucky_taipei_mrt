# pick-history Specification

## Purpose
Persists the user's recent pick tokens in localStorage so they can return to the comment page after their trip, without needing to remember the token URL. Displayed in the Explore page sidebar as a compact record of recent picks.

## Requirements

### Requirement: Pick result is persisted to localStorage on success
每次抽籤成功後，系統 SHALL 將 `{ token: string, stationNameZh: string, pickedAt: number }` 寫入 `localStorage['pick_history']`（JSON array）。新紀錄 SHALL 插入陣列最前方（unshift）。陣列 SHALL 最多保留 3 筆，超過時裁切最舊的。此行為 SHALL 同時適用於捷運與台鐵兩個 picker。

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

#### Scenario: History is capped at 3
- **WHEN** `pick_history` 已有 3 筆紀錄，使用者再次成功抽籤
- **THEN** `localStorage['pick_history']` SHALL 仍包含 3 筆紀錄
- **AND** 最舊的紀錄 SHALL 被移除

#### Scenario: localStorage write failure is silently ignored
- **WHEN** localStorage 不可用（例如 private browsing 禁止存取）
- **THEN** 抽籤結果頁 SHALL 正常顯示，不應拋出錯誤或顯示警示

### Requirement: Explore page sidebar exposes pick history
Explore 頁面左側 SHALL 在有歷史紀錄時顯示最多 3 筆抽籤卡片。無歷史時側欄 SHALL 不顯示。每筆卡片顯示車站名稱、抽籤時間，以及 `comment_used` 狀態。

- 尚未留言的卡片 SHALL 連結至 `/comment?token={token}`
- 已留言的卡片 SHALL 置灰並顯示「已留言」badge，不可點擊
- 側欄 SHALL 顯示「僅限此瀏覽器，最多保留 3 筆」警語

#### Scenario: Panel is hidden when history is empty
- **WHEN** 使用者進入 Explore 頁面，`pick_history` 不存在或為空
- **THEN** 側欄 SHALL NOT 顯示抽籤紀錄 panel

#### Scenario: Panel shows active pick with link
- **WHEN** 使用者有一筆尚未留言的歷史紀錄
- **THEN** 側欄 SHALL 顯示該站名稱與抽籤時間
- **AND** 點擊後 SHALL 導向 `/comment?token={token}`

#### Scenario: Used pick is greyed out
- **WHEN** 一筆歷史紀錄的 token 的 `comment_used` 為 true
- **THEN** 對應卡片 SHALL 呈置灰樣式
- **AND** 卡片 SHALL 顯示「已留言」badge
- **AND** 卡片 SHALL 不可點擊
