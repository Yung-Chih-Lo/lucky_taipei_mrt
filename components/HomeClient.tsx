'use client'

import { useEffect, useState } from 'react'
import MrtPicker from './mrt/MrtPicker'
import TraPicker from './tra/TraPicker'
import { useThemeMode } from './ThemeProvider'
import type { CanvasView, ConnectionView, LineView, StationView } from './types'

type Props = {
  mrt: {
    stations: StationView[]
    connections: ConnectionView[]
    lines: LineView[]
    canvas: CanvasView
  }
  tra: {
    counties: string[]
    countyToStations: Record<string, string[]>
  }
}

export default function HomeClient({ mrt, tra }: Props) {
  const { mode } = useThemeMode()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) return null

  return (
    <div style={{ height: 'calc(100vh - 64px)', overflow: 'hidden', padding: '16px 0 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {mode === 'mrt' ? (
        <MrtPicker
          stations={mrt.stations}
          connections={mrt.connections}
          lines={mrt.lines}
          canvas={mrt.canvas}
        />
      ) : (
        <TraPicker counties={tra.counties} countyToStations={tra.countyToStations} />
      )}
    </div>
  )
}
