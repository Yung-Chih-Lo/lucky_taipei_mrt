'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Empty } from 'antd'
import { EnvironmentOutlined, ExportOutlined } from '@ant-design/icons'
import ShareableTicket from './omikuji/ShareableTicket'
import type { LineView, StationView } from './types'

type Props = {
  station: StationView | null
  lines: LineView[]
  token?: string | null
  commentCount?: number
}

export default function ResultDisplay({ station, lines, token, commentCount = 0 }: Props) {
  const [relayExcerpt, setRelayExcerpt] = useState<string | null>(null)

  useEffect(() => {
    if (!station) return
    setRelayExcerpt(null)
    fetch(`/api/stations/${station.id}/relay`)
      .then((res) => {
        if (res.status === 200) return res.json()
        return null
      })
      .then((data) => {
        if (data?.excerpt) setRelayExcerpt(data.excerpt)
      })
      .catch(() => {})
  }, [station?.id])
  if (!station) {
    return (
      <div style={containerStyle}>
        <Empty description="尚未抽取目的地" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const lineOf = (code: string) => lines.find((l) => l.code === code)
  const wikiLink = `https://zh.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(station.nameZh + '站')}`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    station.nameZh,
  )}+捷運站`

  return (
    <div style={containerStyle}>
      <p style={eyebrowStyle}>此站有緣</p>
      <h2 className="brand-reveal" style={stationNameStyle}>
        {station.nameZh}
      </h2>
      {station.nameEn && <p style={stationEnStyle}>{station.nameEn}</p>}

      {relayExcerpt && (
        <div style={relayBlockStyle}>
          <span style={relayLabelStyle}>前旅人說</span>
          <p style={relayTextStyle}>「{relayExcerpt}」</p>
        </div>
      )}

      <div style={chipsRowStyle}>
        {station.lineCodes.map((code) => {
          const line = lineOf(code)
          return (
            <span
              key={code}
              style={{
                ...chipStyle,
                backgroundColor: line?.color ?? 'var(--paper-surface-elevated)',
              }}
            >
              {line?.nameZh ?? code}
            </span>
          )
        })}
      </div>

      <div style={linksRowStyle}>
        <a href={wikiLink} target="_blank" rel="noopener noreferrer" style={linkPillStyle}>
          <ExportOutlined />
          <span>維基百科</span>
        </a>
        <a href={mapLink} target="_blank" rel="noopener noreferrer" style={linkPillStyle}>
          <EnvironmentOutlined />
          <span>Google Maps</span>
        </a>
      </div>

      {token && (
        <div style={{ width: '100%', marginTop: 18 }}>
          <ShareableTicket token={token} stationNameZh={station.nameZh} />
        </div>
      )}

      <Link
        href={
          commentCount > 0
            ? `/explore?station_id=${station.id}`
            : token
            ? `/comment?token=${encodeURIComponent(token)}`
            : `/explore?station_id=${station.id}`
        }
        style={deepLinkStyle}
      >
        {commentCount > 0
          ? `已有 ${commentCount} 位旅人抽到這站 · 看他們寫了什麼 →`
          : '搶先留下這一站的心得 →'}
      </Link>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 16px 8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: 200,
  color: 'var(--ink)',
}

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--ink-muted)',
  fontSize: 12,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
}

const stationNameStyle: React.CSSProperties = {
  margin: '10px 0 4px',
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 900,
  fontSize: 56,
  lineHeight: 1.1,
  letterSpacing: '0.04em',
  color: 'var(--ink)',
}

const stationEnStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--ink-muted)',
  fontSize: 13,
  letterSpacing: '0.08em',
}

const chipsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 6,
  marginTop: 14,
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: 999,
  color: '#fff',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.04em',
}

const linksRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
  marginTop: 22,
  paddingTop: 18,
  borderTop: '1px solid var(--rule)',
  width: '100%',
  flexWrap: 'wrap',
}

const linkPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid var(--accent)',
  color: 'var(--accent)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
  transition: 'background-color 200ms ease, color 200ms ease',
  cursor: 'pointer',
}

const relayBlockStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 16px',
  borderLeft: '2px solid var(--accent)',
  textAlign: 'left',
  width: '100%',
}

const relayLabelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const relayTextStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 13,
  color: 'var(--ink)',
  fontStyle: 'italic',
  lineHeight: 1.6,
}

const deepLinkStyle: React.CSSProperties = {
  marginTop: 16,
  fontSize: 13,
  color: 'var(--ink-muted)',
  textDecoration: 'none',
  letterSpacing: '0.04em',
  textAlign: 'center',
}
