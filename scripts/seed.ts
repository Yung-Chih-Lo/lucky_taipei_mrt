/* Seeds the SQLite database from the legacy metroData.json.
   Idempotent: re-running against a populated DB does not duplicate rows. */
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import * as schema from '../db/schema'

const LINE_COLORS: Record<string, string> = {
  BR: '#9c6b38',
  R: '#e3192a',
  RA: '#f5a0b5',
  G: '#008659',
  GA: '#99E64D',
  O: '#f5a622',
  BL: '#0070bd',
  Y: '#d4a017',
}

const LINE_NAMES_ZH: Record<string, string> = {
  BR: '文湖線',
  R: '淡水信義線',
  G: '松山新店線',
  O: '中和新蘆線',
  BL: '板南線',
  Y: '環狀線',
  RA: '新北投支線',
  GA: '小碧潭支線',
}

type RawPathPoint = { command: 'M' | 'L' | 'Q'; coordinates: number[] }
type RawConnection = { line: string; from: string; to: string; path: RawPathPoint[] }
type RawStation = {
  id: number
  lines: string[]
  label: string
  lat?: number
  lng?: number
  center: { x: number; y: number }
  name: { zh: string; en?: string; pos: { x: number; y: number; anchor: 'start' | 'middle' | 'end' } }
}
type RawData = {
  size: { width: number; height: number }
  stations: RawStation[]
  connections: RawConnection[]
}

function resolveJsonPath(): string {
  const arg = process.argv[2]
  if (arg) return path.resolve(arg)
  const candidates = [
    path.resolve(process.cwd(), 'scripts/seed-data/metroData.json'),
    path.resolve(process.cwd(), 'src/data/metroData.json'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[0]
}

function main(): void {
  const dbPath = process.env.DATABASE_PATH ?? './data/metro.db'
  const jsonPath = resolveJsonPath()

  if (!fs.existsSync(jsonPath)) {
    console.error(`seed: source JSON not found at ${jsonPath}`)
    process.exit(1)
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  const db = drizzle(sqlite, { schema })
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as RawData

  const now = Date.now()

  const usedLineCodes = new Set<string>()
  for (const s of raw.stations) for (const code of s.lines) usedLineCodes.add(code)
  for (const c of raw.connections) usedLineCodes.add(c.line)

  const nameToId = new Map<string, number>()
  for (const s of raw.stations) nameToId.set(s.name.zh, s.id)

  const tx = sqlite.transaction(() => {
    // canvas_config singleton
    db.run(
      sql`INSERT OR IGNORE INTO canvas_config (id, width, height) VALUES (1, ${raw.size.width}, ${raw.size.height})`,
    )

    // lines
    for (const code of usedLineCodes) {
      db.run(
        sql`INSERT OR IGNORE INTO lines (code, name_zh, color)
            VALUES (${code}, ${LINE_NAMES_ZH[code] ?? null}, ${LINE_COLORS[code] ?? '#999'})`,
      )
    }

    // stations
    for (const s of raw.stations) {
      db.run(sql`
        INSERT OR IGNORE INTO stations
          (id, name_zh, name_en, lat, lng, schematic_x, schematic_y, label_x, label_y, label_anchor, updated_at)
        VALUES
          (${s.id}, ${s.name.zh}, ${s.name.en ?? null},
           ${s.lat ?? null}, ${s.lng ?? null},
           ${s.center.x}, ${s.center.y},
           ${s.name.pos.x}, ${s.name.pos.y}, ${s.name.pos.anchor},
           ${now})
      `)
    }

    // station_lines
    for (const s of raw.stations) {
      for (const code of s.lines) {
        db.run(
          sql`INSERT OR IGNORE INTO station_lines (station_id, line_code) VALUES (${s.id}, ${code})`,
        )
      }
    }

    // connections — idempotency via (from_id, to_id, line_code) uniqueness check
    for (const c of raw.connections) {
      const fromId = nameToId.get(c.from)
      const toId = nameToId.get(c.to)
      if (fromId === undefined || toId === undefined) {
        console.warn(`seed: skipping connection with unknown station (${c.from} -> ${c.to})`)
        continue
      }
      const existing = sqlite
        .prepare(
          'SELECT id FROM connections WHERE from_station_id = ? AND to_station_id = ? AND line_code = ?',
        )
        .get(fromId, toId, c.line)
      if (existing) continue
      db.run(sql`
        INSERT INTO connections (from_station_id, to_station_id, line_code, path_json)
        VALUES (${fromId}, ${toId}, ${c.line}, ${JSON.stringify(c.path)})
      `)
    }
  })

  tx()

  const counts = {
    stations: sqlite.prepare('SELECT COUNT(*) AS n FROM stations').get() as { n: number },
    lines: sqlite.prepare('SELECT COUNT(*) AS n FROM lines').get() as { n: number },
    stationLines: sqlite.prepare('SELECT COUNT(*) AS n FROM station_lines').get() as { n: number },
    connections: sqlite.prepare('SELECT COUNT(*) AS n FROM connections').get() as { n: number },
  }
  console.log(
    `seed: done (stations=${counts.stations.n}, lines=${counts.lines.n}, ` +
      `station_lines=${counts.stationLines.n}, connections=${counts.connections.n})`,
  )

  sqlite.close()
}

main()
