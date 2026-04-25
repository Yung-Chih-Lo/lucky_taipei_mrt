'use client'

import ScreenshotSaveBlock from '../ScreenshotSaveBlock'
import ShareableTicket from './ShareableTicket'

type Variant = 'relay' | 'first'

type Props = {
  token: string
  stationNameZh: string
  ticketNo: string
  dateLabel: string
  variant: Variant
}

const COPY: Record<Variant, { headline: string; description: string }> = {
  relay: {
    headline: '換你·寫下此站心得',
    description: '截圖保存，日後掃描即可留言，與前旅人同框。',
  },
  first: {
    headline: '成為此站·第一位留言者',
    description: '截圖保存此籤，日後掃描留言，你的字會是第一個被後來者看見的。',
  },
}

export default function ScanCtaCard({
  token,
  stationNameZh,
  ticketNo,
  dateLabel,
  variant,
}: Props) {
  const copy = COPY[variant]
  return (
    <div className="scan-cta-card" style={cardStyle}>
      <div style={qrColStyle}>
        <ScreenshotSaveBlock token={token} size={140} />
      </div>
      <div style={textColStyle}>
        <div className="scan-cta-card__eyebrow" style={eyebrowRowStyle}>
          <span style={eyebrowStyle}>SCAN · 心得</span>
          <span style={captionStyle}>
            No.{ticketNo} · {dateLabel}
          </span>
        </div>
        <h3 style={headlineStyle}>{copy.headline}</h3>
        <p style={descriptionStyle}>{copy.description}</p>
        <div style={buttonWrapStyle}>
          <ShareableTicket token={token} stationNameZh={stationNameZh} />
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  background: 'var(--paper-surface-elevated)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
}

const qrColStyle: React.CSSProperties = {
  flexShrink: 0,
}

const textColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: 1,
}

const eyebrowRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '2px 12px',
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const headlineStyle: React.CSSProperties = {
  margin: '4px 0 4px',
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 900,
  fontSize: 18,
  lineHeight: 1.3,
  letterSpacing: '0.02em',
  color: 'var(--ink)',
}

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--ink-muted)',
}

const buttonWrapStyle: React.CSSProperties = {
  marginBottom: 2,
}

const captionStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontSize: 11,
  letterSpacing: '0.08em',
  color: 'var(--ink-muted)',
}
