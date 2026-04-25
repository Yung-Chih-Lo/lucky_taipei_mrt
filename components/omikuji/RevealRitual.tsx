'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import FirstArrivalCard from './FirstArrivalCard'
import RelayExcerptCard from './RelayExcerptCard'
import ScanCtaCard from './ScanCtaCard'

type Props = {
  /** Station name shown character-by-character during the type-in phase. */
  stationName: string
  /** Optional Latin station name, rendered small above the stagger. */
  stationNameEn?: string | null
  ticketNo: string
  dateLabel: string
  /** Required for the scan card QR and share action. */
  token?: string
  /** Station ID used to fetch the relay payload for the upper-zone card. */
  stationId: number
  /**
   * Promise that resolves once the pick-side server work has completed (e.g.
   * the `/api/pick` response). When provided, the ritual pauses at the end of
   * phase 2 (pop) and only enters phase 3 (type-in) after this resolves.
   * If omitted, phases advance on their fixed timers.
   */
  waitFor?: Promise<void> | null
  /** Post-reveal content (station name, chips, links). Shown in the upper zone. */
  children: ReactNode
  /** Called once the full ritual timeline finishes. */
  onDone?: () => void
}

type Phase = 'shake' | 'pop' | 'pop-hold' | 'type' | 'done'

type RelayPayload = {
  excerpt: string | null
  handle: string | null
  postedAt: string | null
  count: number
}

const TIMING = {
  shake: 300,
  pop: 200,
  typePerChar: 60,
  typeTail: 120,
} as const

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function RevealRitual({
  stationName,
  stationNameEn,
  ticketNo,
  dateLabel,
  token,
  stationId,
  waitFor,
  children,
  onDone,
}: Props) {
  const [phase, setPhase] = useState<Phase>('shake')
  const [relay, setRelay] = useState<RelayPayload | 'error' | null>(null)
  const doneCalled = useRef(false)
  const chars = [...stationName]

  useEffect(() => {
    let cancelled = false
    fetch(`/api/stations/${stationId}/relay`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('relay_fetch_failed'))))
      .then((data: RelayPayload) => {
        if (!cancelled) setRelay(data)
      })
      .catch(() => {
        if (!cancelled) setRelay('error')
      })
    return () => {
      cancelled = true
    }
  }, [stationId])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('done')
      if (!doneCalled.current) {
        doneCalled.current = true
        onDone?.()
      }
      return
    }

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const schedule = (ms: number, fn: () => void) => {
      timers.push(setTimeout(() => !cancelled && fn(), ms))
    }

    schedule(TIMING.shake, () => {
      if (!waitFor) {
        setPhase('type')
        return
      }
      setPhase('pop-hold')
      waitFor
        .then(() => {
          if (!cancelled) setPhase('type')
        })
        .catch(() => {
          if (!cancelled) setPhase('type')
        })
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitFor])

  useEffect(() => {
    if (phase !== 'type') return
    const typeMs = chars.length * TIMING.typePerChar + TIMING.typeTail
    const t = setTimeout(() => {
      setPhase('done')
      if (!doneCalled.current) {
        doneCalled.current = true
        onDone?.()
      }
    }, typeMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, chars.length])

  const classNames = ['omikuji-ritual']
  if (phase === 'shake') classNames.push('is-shaking', 'is-flashing')
  if (phase === 'pop-hold' || phase === 'type' || phase === 'done') classNames.push('is-popping')
  if (phase === 'type' || phase === 'done') classNames.push('is-typing')
  if (phase === 'done') classNames.push('is-done')

  const showUpper = relay !== null && relay !== 'error'
  const hasComments = showUpper && (relay as RelayPayload).count > 0
  const scanVariant: 'relay' | 'first' = hasComments ? 'relay' : 'first'

  return (
    <div className={classNames.join(' ')} style={ritualStyle}>
      <div className="omikuji-ritual-flash" aria-hidden="true" />

      <div className="omikuji-ritual-stage" aria-live="polite">
        {stationNameEn && <p style={stageEnStyle}>{stationNameEn}</p>}
        <p style={stageZhStyle}>
          {chars.map((ch, i) => (
            <span
              key={`${i}-${ch}`}
              className="omikuji-ritual-char"
              style={{ animationDelay: `${i * TIMING.typePerChar}ms` }}
            >
              {ch}
            </span>
          ))}
        </p>
      </div>

      <div className="omikuji-ritual-body">
        {children}

        {hasComments && (relay as RelayPayload).excerpt && (relay as RelayPayload).handle && (relay as RelayPayload).postedAt && (
          <RelayExcerptCard
            stationId={stationId}
            excerpt={(relay as RelayPayload).excerpt as string}
            handle={(relay as RelayPayload).handle as string}
            postedAt={(relay as RelayPayload).postedAt as string}
            count={(relay as RelayPayload).count}
          />
        )}
        {showUpper && !hasComments && <FirstArrivalCard />}

        <hr style={dividerStyle} aria-hidden="true" />

        {token && (
          <ScanCtaCard
            token={token}
            stationNameZh={stationName}
            ticketNo={ticketNo}
            dateLabel={dateLabel}
            variant={scanVariant}
          />
        )}
      </div>
    </div>
  )
}

const ritualStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: 240,
}

const stageZhStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 900,
  fontSize: 'clamp(42px, 9vw, 72px)',
  lineHeight: 1.05,
  letterSpacing: '0.08em',
  color: 'var(--ink)',
  textAlign: 'center',
}

const stageEnStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 13,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  textAlign: 'center',
}

const dividerStyle: React.CSSProperties = {
  margin: '10px 0 2px',
  border: 0,
  borderTop: '1px dashed var(--rule)',
}
