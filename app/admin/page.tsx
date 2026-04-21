import AdminClient from '@/components/AdminClient'
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

export default function AdminPage() {
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

  return (
    <AdminClient
      initialStations={stations}
      connections={connections}
      lines={lines}
      canvas={canvas}
    />
  )
}
