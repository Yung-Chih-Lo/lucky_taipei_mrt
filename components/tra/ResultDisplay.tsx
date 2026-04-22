'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from 'antd'
import {
  EnvironmentOutlined,
  ExportOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import ShareableTicket from '@/components/omikuji/ShareableTicket'

const CYCLE_INTERVAL_MS = 80
const CYCLE_DURATION_MS = 2000

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
  countyPool: string[]
  countyToStations: Record<string, string[]>
}

function pickRandomName(countyPool: string[], countyToStations: Record<string, string[]>): string {
  if (countyPool.length === 0) return '...'
  const c = countyPool[Math.floor(Math.random() * countyPool.length)]
  const list = countyToStations[c] ?? []
  if (list.length === 0) return c
  return list[Math.floor(Math.random() * list.length)]
}

export default function TraResultDisplay({ station, token, commentCount = 0, countyPool, countyToStations }: Props) {
  const [displayName, setDisplayName] = useState(station.nameZh)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setDisplayName(station.nameZh)
      setIsAnimating(false)
      return
    }

    setIsAnimating(true)
    setDisplayName(pickRandomName(countyPool, countyToStations))

    intervalRef.current = setInterval(() => {
      setDisplayName(pickRandomName(countyPool, countyToStations))
    }, CYCLE_INTERVAL_MS)

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setDisplayName(station.nameZh)
      setIsAnimating(false)
    }, CYCLE_DURATION_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      intervalRef.current = null
      timeoutRef.current = null
    }
  }, [station.id, station.nameZh, countyPool, countyToStations])

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
      <h2
        className={isAnimating ? '' : 'brand-reveal'}
        style={stationNameStyle}
      >
        {displayName}
        {!isAnimating && <span style={suffixStyle}>車站</span>}
      </h2>
      {!isAnimating && station.county && (
        <p style={countyStyle}>{station.county}</p>
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

      <Link href={commentLink} style={{ width: '100%', marginTop: 18 }}>
        <Button type="primary" size="large" block icon={<MessageOutlined />}>
          留下心得
        </Button>
      </Link>

      <div style={{ width: '100%', marginTop: 10 }}>
        <ShareableTicket token={token} stationNameZh={station.nameZh} />
      </div>

      {!isAnimating && (
        <Link
          href={commentCount > 0 ? `/explore?station_id=${station.id}` : commentLink}
          style={deepLinkStyle}
        >
          {commentCount > 0
            ? `已有 ${commentCount} 位旅人抽到這站 · 看他們寫了什麼 →`
            : '搶先留下這一站的心得 →'}
        </Link>
      )}
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

const deepLinkStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 13,
  color: 'var(--ink-muted)',
  textDecoration: 'none',
  letterSpacing: '0.04em',
  textAlign: 'center',
}
