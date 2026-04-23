# station-relay Specification

## Purpose
Surfaces the most recent traveler comment for a station on the result page, creating a "relay baton" effect: each traveler reads the previous person's message and is motivated to leave one for the next.

## Requirements

### Requirement: Relay API returns latest comment excerpt for a station
系統 SHALL 提供 `GET /api/stations/[id]/relay` endpoint，回傳該站最新一則已通過的留言前 50 個字元（UTF-16 codeunit）。

回應格式：`{ excerpt: string | null }`

- 若該站無留言，`excerpt` SHALL 為 `null`
- Excerpt SHALL 取 `content` 欄位的前 50 個字元，若原文超過 50 字則結尾加 `…`
- 若 `station_id` 不存在於 `stations` 表，回應 SHALL 為 404

#### Scenario: Station has at least one comment
- **WHEN** `GET /api/stations/42/relay` 且 station 42 有至少一則留言
- **THEN** 回應 SHALL 為 200
- **AND** `excerpt` SHALL 等於最新留言 `content` 的前 50 字元（含 `…` 若有截斷）

#### Scenario: Station has no comments
- **WHEN** `GET /api/stations/42/relay` 且 station 42 無任何留言
- **THEN** 回應 SHALL 為 200
- **AND** `excerpt` SHALL 為 `null`

#### Scenario: Station does not exist
- **WHEN** `GET /api/stations/99999/relay` 且 99999 不存在於 stations 表
- **THEN** 回應 SHALL 為 404

### Requirement: Result page displays relay excerpt when available
捷運與台鐵的 ResultDisplay 元件 SHALL 在 station id 已知後 fetch relay API。若 `excerpt` 不為 null，SHALL 在結果頁顯示含「前人留下的話」語義 label 的樣式區塊。若 `excerpt` 為 null 或 fetch 失敗，該區塊 SHALL 靜默不顯示，不影響既有 UI 佈局。

#### Scenario: Relay block appears when excerpt is available
- **WHEN** 使用者抽到車站，且該站有留言
- **THEN** 結果頁 SHALL 顯示包含 `excerpt` 文字的 relay 區塊
- **AND** 區塊 SHALL 包含「前人留下的話」語義的 label（例如：「上一個旅人說」）

#### Scenario: Relay block is absent when no comments exist
- **WHEN** 使用者抽到車站，且該站無留言
- **THEN** 結果頁 SHALL NOT 顯示 relay 區塊
- **AND** 頁面佈局 SHALL 不因缺少此區塊而產生空白跳動

#### Scenario: Relay fetch failure is silently ignored
- **WHEN** relay API 請求逾時或回傳非 2xx
- **THEN** 結果頁 SHALL 正常顯示，不顯示錯誤訊息
- **AND** relay 區塊 SHALL 不出現
