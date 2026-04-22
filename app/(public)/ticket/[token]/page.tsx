import { notFound } from 'next/navigation'
import { getSqlite } from '@/db/client'
import { ticketNoFromToken } from '@/lib/ticketNumber'
import SealMark from '@/components/omikuji/SealMark'

export const dynamic = 'force-dynamic'

type PickRow = {
  id: number
  station_id: number
  transport_type: 'mrt' | 'tra'
  token: string
  picked_at: number
  name_zh: string
  name_en: string | null
  county: string | null
}

function loadPick(token: string): PickRow | null {
  const sqlite = getSqlite()
  const row = sqlite
    .prepare<[string], PickRow>(
      `SELECT p.id, p.station_id, p.transport_type, p.token, p.picked_at,
              s.name_zh, s.name_en, s.county
       FROM station_picks p
       JOIN stations s ON s.id = p.station_id
       WHERE p.token = ?`,
    )
    .get(token)
  return row ?? null
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default function TicketPage({ params }: { params: { token: string } }) {
  const pick = loadPick(params.token)
  if (!pick) notFound()

  const modeLabel = pick.transport_type === 'mrt' ? '捷運' : '台鐵'
  const ticketNo = ticketNoFromToken(pick.token)
  const dateLabel = formatDate(pick.picked_at)

  return (
    <div style={pageStyle}>
      <article style={ticketStyle} aria-label="坐火行 籤紙">
        <header style={headerStyle}>
          <span style={captionStyle}>坐火行 · 坐到哪算哪</span>
          <span style={captionStyle}>No.{ticketNo}</span>
        </header>

        <p style={eyebrowStyle}>此站有緣</p>
        <h1 style={nameZhStyle}>{pick.name_zh}</h1>
        {pick.name_en && <p style={nameEnStyle}>{pick.name_en}</p>}
        {pick.county && <p style={countyStyle}>{pick.county}</p>}

        <div style={sealRowStyle}>
          <SealMark size={96} label={modeLabel} sublabel={`No.${ticketNo}`} />
          <div style={sealMetaStyle}>
            <span style={metaLineStyle}>{dateLabel}</span>
            <span style={metaLineMutedStyle}>{modeLabel}線路</span>
          </div>
        </div>

        <footer style={footerStyle}>
          <span>命中注站 · 坐到哪算哪</span>
          <span style={{ opacity: 0.5 }}>ZUOHUO XING · THIS STATION CHOSE YOU</span>
        </footer>
      </article>

      <p style={shareHintStyle}>
        截圖分享這張籤 · 或存成圖片
      </p>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '32px 20px 48px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  background: 'var(--paper-bg)',
}

const ticketStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 540,
  aspectRatio: '9 / 16',
  padding: '56px 40px',
  background: 'var(--paper-surface)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-lg)',
  boxShadow:
    '3px 3px 0 0 var(--accent-soft), -3px -3px 0 0 rgba(26, 29, 43, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent 0, transparent 38px, rgba(26,29,43,0.03) 38px, rgba(26,29,43,0.03) 39px)',
}

const headerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: '1px dashed var(--rule-strong)',
  paddingBottom: 12,
}

const captionStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 11,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const eyebrowStyle: React.CSSProperties = {
  marginTop: 'auto',
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 12,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const nameZhStyle: React.CSSProperties = {
  margin: '16px 0 6px',
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 900,
  fontSize: 84,
  lineHeight: 1,
  letterSpacing: '0.04em',
  color: 'var(--ink)',
}

const nameEnStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 16,
  letterSpacing: '0.16em',
  color: 'var(--ink-muted)',
}

const countyStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 14,
  letterSpacing: '0.16em',
  color: 'var(--ink-muted)',
}

const sealRowStyle: React.CSSProperties = {
  marginTop: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 18,
}

const sealMetaStyle: React.CSSProperties = {
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const metaLineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 700,
  fontSize: 18,
  color: 'var(--ink)',
  letterSpacing: '0.12em',
}

const metaLineMutedStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: '0.16em',
  color: 'var(--ink-muted)',
}

const footerStyle: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: 24,
  width: '100%',
  borderTop: '1px dashed var(--rule-strong)',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  letterSpacing: '0.24em',
  color: 'var(--ink-muted)',
  textTransform: 'uppercase',
}

const shareHintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'var(--ink-muted)',
  letterSpacing: '0.08em',
}
