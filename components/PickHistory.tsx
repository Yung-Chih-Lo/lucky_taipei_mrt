'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadPickHistory, type PickHistoryEntry } from '@/lib/pickHistory'

type EntryWithStatus = PickHistoryEntry & { commentUsed?: boolean; transport?: 'mrt' | 'tra' }

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  return new Date(ts).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

export default function PickHistory() {
  const [entries, setEntries] = useState<EntryWithStatus[]>([])

  useEffect(() => {
    const raw = loadPickHistory()
    if (raw.length === 0) return
    setEntries(raw)

    raw.forEach((entry, i) => {
      fetch(`/api/comments/${encodeURIComponent(entry.token)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return
          setEntries((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], commentUsed: !!data.comment_used, transport: data.station?.transport_type }
            return next
          })
        })
        .catch(() => {})
    })
  }, [])

  if (entries.length === 0) return null

  return (
    <div style={panelStyle}>
      <p style={titleStyle}>我的抽籤紀錄</p>
      <p style={hintStyle}>僅限此瀏覽器，最多保留 3 筆</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry) => {
          const used = entry.commentUsed === true

          if (used) {
            return (
              <div key={entry.token} style={{ ...cardBase, ...cardUsed }}>
                <div style={cardRow}>
                  <span style={stationNameUsed}>{entry.stationNameZh}</span>
                  <span style={badgeUsed}>已留言</span>
                </div>
                <span style={dateStyle}>{formatRelative(entry.pickedAt)}</span>
              </div>
            )
          }

          return (
            <Link
              key={entry.token}
              href={`/comment?token=${encodeURIComponent(entry.token)}`}
              style={{ ...cardBase, ...cardActive }}
            >
              <div style={cardRow}>
                <span style={stationNameActive}>{entry.stationNameZh}</span>
                <span style={arrowStyle}>→</span>
              </div>
              <span style={dateStyle}>{formatRelative(entry.pickedAt)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  padding: '16px 0',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 2px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
}

const hintStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 11,
  color: 'var(--ink-muted)',
  lineHeight: 1.4,
}

const cardBase: React.CSSProperties = {
  display: 'block',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--rule)',
  textDecoration: 'none',
}

const cardActive: React.CSSProperties = {
  backgroundColor: 'var(--paper-surface-elevated)',
  cursor: 'pointer',
}

const cardUsed: React.CSSProperties = {
  backgroundColor: 'transparent',
  opacity: 0.5,
  cursor: 'default',
}

const cardRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
}

const stationNameActive: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--ink)',
}

const stationNameUsed: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--ink-muted)',
}

const arrowStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--accent)',
  flexShrink: 0,
}

const badgeUsed: React.CSSProperties = {
  fontSize: 10,
  padding: '2px 6px',
  borderRadius: 999,
  border: '1px solid var(--rule)',
  color: 'var(--ink-muted)',
  flexShrink: 0,
}

const dateStyle: React.CSSProperties = {
  display: 'block',
  marginTop: 3,
  fontSize: 11,
  color: 'var(--ink-muted)',
}
