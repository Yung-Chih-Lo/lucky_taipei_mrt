import type { StationView } from '@/components/types'

const SINGLE_STATION_EXCEPTIONS = new Set(['新北投', '小碧潭'])

export function pickRandomStation(
  stations: StationView[],
  selectedLineCodes: string[],
): StationView | null {
  const pool = filterByLines(stations, selectedLineCodes)
  if (pool.length === 0) return null

  if (pool.length === 1 && SINGLE_STATION_EXCEPTIONS.has(pool[0].nameZh)) {
    return pool[0]
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

export function filterByLines(
  stations: StationView[],
  selectedLineCodes: string[],
): StationView[] {
  if (selectedLineCodes.length === 0) return stations
  return stations.filter((s) =>
    s.lineCodes.some((code) => selectedLineCodes.includes(code)),
  )
}
