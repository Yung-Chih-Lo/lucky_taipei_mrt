'use client'

import { useMemo, useState } from 'react'
import { Modal, message } from 'antd'
import TaiwanSvgMap from './TaiwanSvgMap'
import TraSidebar from './Sidebar'
import TraResultDisplay from './ResultDisplay'
import RevealRitual from '@/components/omikuji/RevealRitual'
import { ticketNoFromToken, formatPickDate } from '@/lib/ticketNumber'
import { paperTokens } from '@/lib/theme'

const MODAL_TITLES = [
  '下一站開往…',
  '命運決定了…',
  '今天的籤',
  '台鐵替你選的是',
]

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

  const sortedCounties = useMemo(() => [...counties], [counties])

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
          result ? (
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
                countyPool={selectedCounties}
                countyToStations={countyToStations}
              />
            </RevealRitual>
          ) : (
            <div style={ritualPendingStyle} aria-live="polite">
              <p style={{ margin: 0, color: 'var(--ink-muted)', letterSpacing: '0.24em' }}>
                搖 籤 筒…
              </p>
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

const ritualPendingStyle: React.CSSProperties = {
  minHeight: 240,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
