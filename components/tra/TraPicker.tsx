'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, message } from 'antd'
import TaiwanSvgMap from './TaiwanSvgMap'
import TraSidebar from './Sidebar'
import TraResultDisplay from './ResultDisplay'
import RevealRitual from '@/components/omikuji/RevealRitual'
import { ticketNoFromToken, formatPickDate } from '@/lib/ticketNumber'
import { paperTokens } from '@/lib/theme'
import { savePickToHistory } from '@/lib/pickHistory'

const MODAL_TITLES = [
  '下一站開往…',
  '命運決定了…',
  '今天的籤',
  '台鐵替你選的是',
]

const CYCLE_INTERVAL_MS = 80
const MIN_CYCLE_MS = 1500

function pickRandomStation(countyPool: string[], countyToStations: Record<string, string[]>): string {
  if (countyPool.length === 0) return '…'
  const c = countyPool[Math.floor(Math.random() * countyPool.length)]
  const list = countyToStations[c] ?? []
  return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : c
}

type CountyMap = Record<string, string[]>

type Props = {
  counties: string[]
  countyToStations: CountyMap
}

type PickResult = {
  token: string
  comment_count?: number
  station: {
    id: number
    nameZh: string
    nameEn: string | null
    county: string | null
    transportType: 'tra'
  }
}

export default function TraPicker({ counties, countyToStations }: Props) {
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])
  const [isPicking, setIsPicking] = useState(false)
  const [result, setResult] = useState<PickResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [titleIndex, setTitleIndex] = useState(0)
  const [messageApi, contextHolder] = message.useMessage()
  const [cyclingName, setCyclingName] = useState('…')
  const [showResult, setShowResult] = useState(false)
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cycleStartRef = useRef<number | null>(null)

  const sortedCounties = useMemo(() => [...counties], [counties])

  // Start cycling when modal opens, reset showResult
  useEffect(() => {
    if (!modalOpen) {
      setShowResult(false)
      cycleStartRef.current = null
      if (cycleRef.current) {
        clearInterval(cycleRef.current)
        cycleRef.current = null
      }
      return
    }
    cycleStartRef.current = Date.now()
    setShowResult(false)
    setCyclingName(pickRandomStation(selectedCounties, countyToStations))
    cycleRef.current = setInterval(() => {
      setCyclingName(pickRandomStation(selectedCounties, countyToStations))
    }, CYCLE_INTERVAL_MS)
    return () => {
      if (cycleRef.current) {
        clearInterval(cycleRef.current)
        cycleRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen])

  // When result arrives, wait for minimum cycling time before revealing
  useEffect(() => {
    if (!result || !cycleStartRef.current) return
    const elapsed = Date.now() - cycleStartRef.current
    const remaining = Math.max(0, MIN_CYCLE_MS - elapsed)
    const t = setTimeout(() => {
      if (cycleRef.current) {
        clearInterval(cycleRef.current)
        cycleRef.current = null
      }
      setShowResult(true)
    }, remaining)
    return () => clearTimeout(t)
  }, [result])

  const handleToggleCounty = (county: string) => {
    setSelectedCounties((prev) =>
      prev.includes(county) ? prev.filter((c) => c !== county) : [...prev, county],
    )
  }

  const [pickPromise, setPickPromise] = useState<Promise<void> | null>(null)

  const handlePick = () => {
    if (selectedCounties.length === 0 || isPicking) return
    setIsPicking(true)
    setResult(null)

    // Open the modal immediately so the ritual can start shaking while the
    // pick request is in flight.
    const request = (async () => {
      try {
        const res = await fetch('/api/pick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transport_type: 'tra',
            filter: { counties: selectedCounties },
          }),
        })

        if (res.status === 429) {
          messageApi.warning('太快了！請稍候再試')
          setModalOpen(false)
          return
        }
        if (res.status === 422) {
          messageApi.warning('這個範圍內沒有車站可抽')
          setModalOpen(false)
          return
        }
        if (!res.ok) {
          messageApi.error('抽籤失敗，請稍後再試')
          setModalOpen(false)
          return
        }

        const data = (await res.json()) as PickResult
        setResult(data)
        savePickToHistory(data.token, data.station.nameZh)
      } catch {
        messageApi.error('網路錯誤，請稍後再試')
        setModalOpen(false)
      } finally {
        setIsPicking(false)
      }
    })()

    setTitleIndex((i) => (i + 1) % MODAL_TITLES.length)
    setPickPromise(request)
    setModalOpen(true)
  }

  return (
    <div className="omikuji-card" style={cardStyle}>
      {contextHolder}
      <div style={cardCaptionStyle}>
        <span>坐火行 · 命中注站</span>
        <span>坐到哪算哪</span>
      </div>

      <div className="picker-split">
        <aside style={leftPaneStyle}>
          <TraSidebar
            counties={sortedCounties}
            selectedCounties={selectedCounties}
            onChange={setSelectedCounties}
            onPick={handlePick}
            isPicking={isPicking}
          />
        </aside>

        <div className="rail-tick-rule is-vertical" aria-hidden="true" />
        <div className="rail-tick-rule is-horizontal" aria-hidden="true" />

        <main style={mainPaneStyle}>
          <div style={mapContainerStyle}>
            <TaiwanSvgMap
              selectedCounties={selectedCounties}
              availableCounties={sortedCounties}
              onToggleCounty={handleToggleCounty}
            />
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
        {modalOpen && (
          showResult && result ? (
            <RevealRitual
              stationName={result.station.nameZh}
              stationNameEn={result.station.nameEn}
              ticketNo={ticketNoFromToken(result.token)}
              dateLabel={formatPickDate()}
              modeLabel="台鐵"
              waitFor={pickPromise}
            >
              <TraResultDisplay
                station={result.station}
                token={result.token}
                commentCount={result.comment_count ?? 0}
              />
            </RevealRitual>
          ) : (
            <div style={ritualPendingStyle} aria-live="polite">
              <p style={cyclingNameStyle}>{cyclingName}</p>
            </div>
          )
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
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
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
  minHeight: 0,
  height: '100%',
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

const ritualPendingStyle: React.CSSProperties = {
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
}

const cyclingNameStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 900,
  fontSize: 'clamp(42px, 9vw, 72px)',
  lineHeight: 1.05,
  letterSpacing: '0.08em',
  color: 'var(--ink)',
  textAlign: 'center',
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
