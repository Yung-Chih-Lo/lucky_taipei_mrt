export type LabelAnchor = 'start' | 'middle' | 'end'

export type StationView = {
  id: number
  nameZh: string
  nameEn: string | null
  schematicX: number
  schematicY: number
  labelX: number
  labelY: number
  labelAnchor: LabelAnchor
  lineCodes: string[]
}

export type ConnectionPathCommand = 'M' | 'L' | 'Q'

export type ConnectionPathPoint = {
  command: ConnectionPathCommand
  coordinates: number[]
}

export type ConnectionView = {
  id: number
  fromStationId: number
  toStationId: number
  lineCode: string
  path: ConnectionPathPoint[]
}

export type LineView = {
  code: string
  nameZh: string | null
  nameEn: string | null
  color: string
}

export type CanvasView = {
  width: number
  height: number
}
