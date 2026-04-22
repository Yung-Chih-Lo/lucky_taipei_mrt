'use client'

import { useState } from 'react'
import { Modal } from 'antd'
import SchematicMap from '../SchematicMap'
import Sidebar from '../Sidebar'
import ResultDisplay from '../ResultDisplay'
import { filterByLines, pickRandomStation } from '@/lib/randomStation'
import { paperTokens } from '@/lib/theme'
import RevealRitual from '@/components/omikuji/RevealRitual'
import { ticketNoFromToken, formatPickDate } from '@/lib/ticketNumber'
import type { CanvasView, ConnectionView, LineView, StationView } from '../types'

const MODAL_TITLES = [
  '下一班列車開往…',
  '命運決定了…',
  '今天的籤',
  '捷運替你選的是',
]

const INTERMEDIATE_HOPS = 12

type Props = {
  stations: StationView[]
  connections: ConnectionView[]
  lines: LineView[]
  canvas: CanvasView
}

export default function MrtPicker({ stations, connections, lines, canvas }: Props) {
  const [selectedLineCodes, setSelectedLineCodes] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationStations, setAnimationStations] = useState<StationView[]>([])
  const [result, setResult] = useState<StationView | null>(null)
  const [pickToken, setPickToken] = useState<string | null>(null)
  const [commentCount, setCommentCount] = useState(0)
  const [pickPromise, setPickPromise] = useState<Promise<void> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [titleIndex, setTitleIndex] = useState(0)

  const handleLineChange = (codes: string[]) => {
    setSelectedLineCodes(codes)
    setResult(null)
    setPickToken(null)
    setCommentCount(0)
    setPickPromise(null)
    setModalOpen(false)
  }

  const handleRandomPick = () => {
    const finalStation = pickRandomStation(stations, selectedLineCodes)
    if (!finalStation) return

    setResult(finalStation)
    setTitleIndex((i) => (i + 1) % MODAL_TITLES.length)

    // Register the pick on the server; the returned promise feeds RevealRitual
    // so it can hold the stamp phase until the token + comment_count land.
    const request = (async () => {
      try {
        const res = await fetch('/api/pick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transport_type: 'mrt',
            filter: { line_codes: selectedLineCodes },
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as { token?: string; comment_count?: number }
          if (data.token) setPickToken(data.token)
          if (typeof data.comment_count === 'number') setCommentCount(data.comment_count)
        }
      } catch {
        // ignore; UI will render with a generated fallback token
      }
    })()
    setPickPromise(request)

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setAnimationStations([])
      setModalOpen(true)
      return
    }

    const pool = filterByLines(stations, selectedLineCodes)
    const intermediates = Array.from(
      { length: INTERMEDIATE_HOPS },
      () => pool[Math.floor(Math.random() * pool.length)],
    )

    setAnimationStations([...intermediates, finalStation])
    setIsAnimating(true)
  }

  const handleAnimationEnd = () => {
    setIsAnimating(false)
    setModalOpen(true)
  }

  return (
    <div className="omikuji-card" style={cardStyle}>
      <div style={cardCaptionStyle}>
        <span>坐火行 · 命中注站</span>
        <span>坐到哪算哪</span>
      </div>

      <div className="picker-split">
        <aside style={leftPaneStyle}>
          <Sidebar
            lines={lines}
            selectedLineCodes={selectedLineCodes}
            onLineChange={handleLineChange}
            onRandomPick={handleRandomPick}
            isAnimating={isAnimating}
          />
        </aside>

        <div className="rail-tick-rule is-vertical" aria-hidden="true" />
        <div className="rail-tick-rule is-horizontal" aria-hidden="true" />

        <main style={mainPaneStyle}>
          <div style={mapContainerStyle}>
            <div style={mapInnerStyle}>
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
          </div>
        </main>
      </div>

      <Modal
        title={<span style={modalTitleStyle}>{MODAL_TITLES[titleIndex]}</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
        styles={{
          content: {
            background: 'var(--paper-surface-elevated)',
            border: '1px solid var(--rule-strong)',
            borderRadius: 'var(--radius-lg)',
          },
          header: { background: 'transparent', borderBottom: 'none' },
          mask: { background: paperTokens.maskBg },
        }}
      >
        {modalOpen && result && (
          <RevealRitual
            stationName={result.nameZh}
            stationNameEn={result.nameEn}
            ticketNo={ticketNoFromToken(pickToken ?? String(result.id))}
            dateLabel={formatPickDate()}
            modeLabel="捷運"
            waitFor={pickPromise}
          >
            <ResultDisplay
              station={result}
              lines={lines}
              token={pickToken}
              commentCount={commentCount}
            />
          </RevealRitual>
        )}
      </Modal>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  margin: '0 20px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  height: 'calc(93vh - 64px - 16px)',
  minHeight: 520,
}

const cardCaptionStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 11,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  padding: '0 6px',
}

const leftPaneStyle: React.CSSProperties = {
  padding: '8px 8px 8px 6px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}

const mainPaneStyle: React.CSSProperties = {
  padding: '8px 6px 8px 8px',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
}

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  flex: 1,
  minHeight: 0,
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  background: 'var(--paper-surface)',
  border: '1px solid var(--rule)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 16,
}

const mapInnerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  maxWidth: 640,
  maxHeight: 640,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const modalTitleStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}
