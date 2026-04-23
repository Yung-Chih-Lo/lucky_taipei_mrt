'use client'

import { useEffect, useState } from 'react'
import { EnvironmentOutlined, ExportOutlined } from '@ant-design/icons'
import Link from 'next/link'
import ShareableTicket from '@/components/omikuji/ShareableTicket'

type ResultStation = {
  id: number
  nameZh: string
  nameEn: string | null
  county: string | null
}

type Props = {
  station: ResultStation
  token: string
  commentCount?: number
}

export default function TraResultDisplay({ station, token, commentCount = 0 }: Props) {
  const [relayExcerpt, setRelayExcerpt] = useState<string | null>(null)

  useEffect(() => {
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
  }, [station.id])

  const wikiLink = `https://zh.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(
    station.nameZh + '車站',
  )}`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    station.nameZh + '車站',
  )}`
  const commentLink = `/comment?token=${encodeURIComponent(token)}`

  return (
    <div style={containerStyle}>
      <p style={eyebrowStyle}>此站有緣</p>
      <h2 className="brand-reveal" style={stationNameStyle}>
        {station.nameZh}
        <span style={suffixStyle}>車站</span>
      </h2>
      {station.county && (
        <p style={countyStyle}>{station.county}</p>
      )}

      {relayExcerpt && (
        <div style={relayBlockStyle}>
          <span style={relayLabelStyle}>前旅人說</span>
          <p style={relayTextStyle}>「{relayExcerpt}」</p>
        </div>
      )}

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

      <div style={{ width: '100%', marginTop: 18 }}>
        <ShareableTicket token={token} stationNameZh={station.nameZh} />
      </div>

      <Link
        href={commentCount > 0 ? `/explore?station_id=${station.id}` : commentLink}
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

const suffixStyle: React.CSSProperties = {
  fontSize: 28,
  marginLeft: 6,
  color: 'var(--ink-muted)',
  fontWeight: 500,
}

const countyStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: 'var(--ink-muted)',
  fontSize: 14,
  letterSpacing: '0.08em',
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
  marginTop: 12,
  fontSize: 13,
  color: 'var(--ink-muted)',
  textDecoration: 'none',
  letterSpacing: '0.04em',
  textAlign: 'center',
}
