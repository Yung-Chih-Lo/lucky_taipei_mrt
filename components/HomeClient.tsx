'use client'

import { useState } from 'react'
import { Modal, Typography } from 'antd'
import SchematicMap from './SchematicMap'
import Sidebar from './Sidebar'
import ResultDisplay from './ResultDisplay'
import { filterByLines, pickRandomStation } from '@/lib/randomStation'
import type { CanvasView, ConnectionView, LineView, StationView } from './types'

const { Title } = Typography

const MODAL_TITLES = [
  '下一班列車開往...',
  '捷運隨機 GO！',
  '今天的幸運捷運站？',
  '探索城市節點...',
]

const INTERMEDIATE_HOPS = 12

type Props = {
  stations: StationView[]
  connections: ConnectionView[]
  lines: LineView[]
  canvas: CanvasView
}

export default function HomeClient({ stations, connections, lines, canvas }: Props) {
  const [selectedLineCodes, setSelectedLineCodes] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationStations, setAnimationStations] = useState<StationView[]>([])
  const [result, setResult] = useState<StationView | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [titleIndex, setTitleIndex] = useState(0)

  const handleLineChange = (codes: string[]) => {
    setSelectedLineCodes(codes)
    setResult(null)
    setModalOpen(false)
  }

  const handleRandomPick = () => {
    const finalStation = pickRandomStation(stations, selectedLineCodes)
    if (!finalStation) return

    const pool = filterByLines(stations, selectedLineCodes)
    const intermediates = Array.from(
      { length: INTERMEDIATE_HOPS },
      () => pool[Math.floor(Math.random() * pool.length)],
    )

    setAnimationStations([...intermediates, finalStation])
    setResult(finalStation)
    setTitleIndex((i) => (i + 1) % MODAL_TITLES.length)
    setIsAnimating(true)
  }

  const handleAnimationEnd = () => {
    setIsAnimating(false)
    setModalOpen(true)
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'row',
        flexWrap: 'wrap',
      }}
    >
      <div style={sidebarAreaStyle}>
        <Sidebar
          lines={lines}
          selectedLineCodes={selectedLineCodes}
          onLineChange={handleLineChange}
          onRandomPick={handleRandomPick}
          isAnimating={isAnimating}
        />
      </div>

      <main style={mainAreaStyle}>
        <Title
          level={3}
          style={{ marginBottom: 16, color: '#595959', textAlign: 'center' }}
        >
          台北捷運路網圖
        </Title>
        <div style={mapContainerStyle}>
          <SchematicMap
            stations={stations}
            connections={connections}
            lines={lines}
            canvas={canvas}
            selectedLineCodes={selectedLineCodes}
            animationStations={animationStations}
            isAnimating={isAnimating}
            onAnimationEnd={handleAnimationEnd}
          />
        </div>
      </main>

      <Modal
        title={
          <Title level={4} style={{ textAlign: 'center', margin: 0 }}>
            {MODAL_TITLES[titleIndex]}
          </Title>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
      >
        {modalOpen && <ResultDisplay station={result} lines={lines} />}
      </Modal>
    </div>
  )
}

const sidebarAreaStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  boxShadow: '2px 0 6px rgba(0, 21, 41, 0.08)',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  width: 280,
}

const mainAreaStyle: React.CSSProperties = {
  flexGrow: 1,
  padding: 24,
  backgroundColor: '#f0f2f5',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  flex: 1,
  minHeight: 400,
  maxHeight: '80vh',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  backgroundColor: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}
