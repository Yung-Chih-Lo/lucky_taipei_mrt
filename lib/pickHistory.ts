const STORAGE_KEY = 'pick_history'
const MAX_ENTRIES = 3

export type PickHistoryEntry = {
  token: string
  stationNameZh: string
  pickedAt: number
}

export function savePickToHistory(token: string, stationNameZh: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PickHistoryEntry[]
    existing.unshift({ token, stationNameZh, pickedAt: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, MAX_ENTRIES)))
  } catch {}
}

export function loadPickHistory(): PickHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PickHistoryEntry[]
  } catch {
    return []
  }
}
