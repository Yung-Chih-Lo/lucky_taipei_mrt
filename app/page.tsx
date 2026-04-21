import HomeClient from '@/components/HomeClient'
import {
  getAllStationsWithLines,
  getCanvasConfig,
  getConnections,
  getLinesMap,
} from '@/db/queries'
import type {
  CanvasView,
  ConnectionView,
  LineView,
  StationView,
} from '@/components/types'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const stationsRaw = getAllStationsWithLines()
  const connectionsRaw = getConnections()
  const linesRaw = Array.from(getLinesMap().values())
  const canvas: CanvasView = getCanvasConfig()

  const stations: StationView[] = stationsRaw.map((s) => ({
    id: s.id,
    nameZh: s.nameZh,
    nameEn: s.nameEn,
    schematicX: s.schematicX,
    schematicY: s.schematicY,
    labelX: s.labelX,
    labelY: s.labelY,
    labelAnchor: s.labelAnchor,
    lineCodes: s.lineCodes,
  }))

  const connections: ConnectionView[] = connectionsRaw.map((c) => ({
    id: c.id,
    fromStationId: c.fromStationId,
    toStationId: c.toStationId,
    lineCode: c.lineCode,
    path: c.path,
  }))

  const lines: LineView[] = linesRaw.map((l) => ({
    code: l.code,
    nameZh: l.nameZh,
    nameEn: l.nameEn,
    color: l.color,
  }))

  if (stations.length === 0) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Lucky Station</h1>
        <p>Database is empty. Run <code>npm run migrate &amp;&amp; npm run seed</code>.</p>
      </main>
    )
  }

  return (
    <HomeClient
      stations={stations}
      connections={connections}
      lines={lines}
      canvas={canvas}
    />
  )
}
