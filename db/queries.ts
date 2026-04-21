import 'server-only'
import { eq } from 'drizzle-orm'
import { getDb } from './client'
import {
  canvasConfig,
  connections,
  lines,
  stationLines,
  stations,
  type ConnectionPathPoint,
  type Line,
  type Station,
} from './schema'

export type StationWithLines = Station & { lineCodes: string[] }

export type ConnectionRow = {
  id: number
  fromStationId: number
  toStationId: number
  lineCode: string
  path: ConnectionPathPoint[]
}

export type CanvasConfig = { width: number; height: number }

export function getCanvasConfig(): CanvasConfig {
  const db = getDb()
  const row = db.select().from(canvasConfig).where(eq(canvasConfig.id, 1)).get()
  if (!row) {
    throw new Error('canvas_config row missing; run `npm run seed`')
  }
  return { width: row.width, height: row.height }
}

export function getLinesMap(): Map<string, Line> {
  const db = getDb()
  const rows = db.select().from(lines).all()
  return new Map(rows.map((r) => [r.code, r]))
}

export function getAllStationsWithLines(): StationWithLines[] {
  const db = getDb()
  const rows = db
    .select({ station: stations, lineCode: stationLines.lineCode })
    .from(stations)
    .leftJoin(stationLines, eq(stationLines.stationId, stations.id))
    .all()

  const map = new Map<number, StationWithLines>()
  for (const { station, lineCode } of rows) {
    const existing = map.get(station.id)
    if (existing) {
      if (lineCode) existing.lineCodes.push(lineCode)
    } else {
      map.set(station.id, { ...station, lineCodes: lineCode ? [lineCode] : [] })
    }
  }
  return Array.from(map.values())
}

export function getConnections(): ConnectionRow[] {
  const db = getDb()
  const rows = db.select().from(connections).all()
  return rows.map((r) => ({
    id: r.id,
    fromStationId: r.fromStationId,
    toStationId: r.toStationId,
    lineCode: r.lineCode,
    path: JSON.parse(r.pathJson) as ConnectionPathPoint[],
  }))
}
