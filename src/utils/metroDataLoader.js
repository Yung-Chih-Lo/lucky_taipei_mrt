import bundledData from '../data/metroData.json'

const STORAGE_KEY = 'metroData_override'

export function getActiveMetroData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.stations?.length > 0) return parsed
    }
  } catch (e) {
    console.warn('localStorage metroData parse error, using bundled data', e)
  }
  return bundledData
}

export function saveMetroDataToStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearMetroDataStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasStoredOverride() {
  return !!localStorage.getItem(STORAGE_KEY)
}
