'use client'

import Link from 'next/link'
import { formatRelativeZhTW } from '@/lib/relativeTime'

type Props = {
  stationId: number
  excerpt: string
  handle: string
  postedAt: string
  count: number
}

export default function RelayExcerptCard({
  stationId,
  excerpt,
  handle,
  postedAt,
  count,
}: Props) {
  const relativeTime = formatRelativeZhTW(postedAt)
  const otherCount = count - 1

  return (
    <div style={cardStyle}>
      <span aria-hidden="true" style={{ ...tapeStyle, ...tapeLeftStyle }} />
      <span aria-hidden="true" style={{ ...tapeStyle, ...tapeRightStyle }} />

      <p style={eyebrowStyle}>前　旅　人　隨　筆</p>
      <p style={excerptStyle}>{excerpt}</p>

      <div style={footerStyle}>
        <span style={attributionStyle}>
          — 旅人 #{handle} · {relativeTime}
        </span>
        {otherCount > 0 && (
          <Link href={`/explore?station_id=${stationId}`} style={moreLinkStyle}>
            更多 {otherCount} 則 →
          </Link>
        )}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  position: 'relative',
  marginTop: 8,
  padding: '12px 16px 10px',
  background: 'var(--paper-surface)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-sm)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
}

const tapeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -8,
  width: 48,
  height: 16,
  background: 'rgba(210, 170, 110, 0.45)',
  borderLeft: '1px dashed rgba(150, 110, 60, 0.25)',
  borderRight: '1px dashed rgba(150, 110, 60, 0.25)',
}

const tapeLeftStyle: React.CSSProperties = {
  left: 16,
  transform: 'rotate(-4deg)',
}

const tapeRightStyle: React.CSSProperties = {
  right: 16,
  transform: 'rotate(3deg)',
}

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  letterSpacing: '0.32em',
  color: 'var(--accent)',
}

const excerptStyle: React.CSSProperties = {
  margin: '6px 0 8px',
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontStyle: 'italic',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--ink)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  paddingTop: 8,
  borderTop: '1px dashed var(--rule)',
}

const attributionStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--ink-muted)',
  letterSpacing: '0.04em',
}

const moreLinkStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--accent)',
  textDecoration: 'none',
  fontWeight: 500,
  letterSpacing: '0.04em',
}
