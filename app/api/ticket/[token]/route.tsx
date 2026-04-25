import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'
import { NextResponse } from 'next/server'
import { getSqlite } from '@/db/client'
import { toChineseNumerals } from '@/lib/chineseNumerals'

export const runtime = 'nodejs'

type PickRow = {
  id: number
  station_id: number
  transport_type: 'mrt' | 'tra'
  token: string
  picked_at: number
  name_zh: string
  name_en: string | null
  county: string | null
  line_name_zh: string | null
  line_color: string | null
}

const INK = '#1A1D2B'
const INK_MUTED = '#6B6557'
const PAPER = '#F3EBD6'
const SEAL = '#C8954A'
const STAMP_RED = '#A83A3A'
const RULE_STRONG = 'rgba(26, 29, 43, 0.28)'
const RULE_SOFT = 'rgba(26, 29, 43, 0.18)'
const NEUTRAL_CHIP_BG = 'rgba(26, 29, 43, 0.10)'

const S = 2
const W = 1080 * S
const H = 607 * S

async function loadFont(relative: string): Promise<ArrayBuffer> {
  const p = path.join(process.cwd(), 'public', 'fonts', relative)
  const buf = await readFile(p)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

function formatDateWithMidDot(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${day}`
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const sqlite = getSqlite()
  const pick = sqlite
    .prepare<[string], PickRow>(
      `SELECT p.id, p.station_id, p.transport_type, p.token, p.picked_at,
              s.name_zh, s.name_en, s.county,
              l.name_zh AS line_name_zh, l.color AS line_color
       FROM station_picks p
       JOIN stations s ON s.id = p.station_id
       LEFT JOIN station_lines sl ON sl.station_id = s.id
       LEFT JOIN lines l ON l.code = sl.line_code
       WHERE p.token = ? AND p.transport_type = 'mrt'
       ORDER BY LENGTH(sl.line_code) DESC, sl.line_code ASC
       LIMIT 1`,
    )
    .get(token)
    ?? sqlite
      .prepare<[string], PickRow>(
        `SELECT p.id, p.station_id, p.transport_type, p.token, p.picked_at,
                s.name_zh, s.name_en, s.county,
                NULL AS line_name_zh, NULL AS line_color
         FROM station_picks p
         JOIN stations s ON s.id = p.station_id
         WHERE p.token = ?`,
      )
      .get(token)

  if (!pick) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const [serif, sans, mono] = await Promise.all([
    loadFont('NotoSerifTC-900-subset.ttf'),
    loadFont('NotoSansTC-500-subset.ttf'),
    loadFont('JetBrainsMono-500.ttf'),
  ])

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || new URL(req.url).origin
  const qrTarget = `${baseUrl}/`
  const qrSvg = await QRCode.toString(qrTarget, {
    type: 'svg',
    margin: 1,
    color: { dark: INK, light: PAPER },
  })
  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`

  const ticketNo = String(pick.id).padStart(4, '0')
  const dateLabel = formatDateWithMidDot(pick.picked_at)
  const ticketNoChinese = toChineseNumerals(ticketNo)
  const verticalBandGlyphs = [
    '坐', '火', '行',
    '·',
    '命', '籤', '第',
    ...ticketNoChinese.split(''),
    '號',
  ]

  const nameLen = pick.name_zh.length
  const nameFontSize = (nameLen <= 2 ? 220 : nameLen <= 3 ? 180 : nameLen <= 4 ? 140 : 108) * S

  const chipLabel =
    pick.transport_type === 'mrt' && pick.line_name_zh
      ? pick.line_name_zh
      : pick.county ?? '台鐵'
  const chipBg =
    pick.transport_type === 'mrt' && pick.line_color
      ? pick.line_color
      : NEUTRAL_CHIP_BG
  const chipColor = INK

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: PAPER,
          display: 'flex',
          fontFamily: 'NotoSerifTC, serif',
          position: 'relative',
          boxSizing: 'border-box',
          borderTop: `${2 * S}px solid ${RULE_SOFT}`,
          borderBottom: `${2 * S}px solid ${RULE_SOFT}`,
          padding: `${10 * S}px 0`,
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', height: 2 * S, background: RULE_SOFT, marginTop: 3 * S }} />
        <div style={{ display: 'flex', flex: 1 }}>
        {/* Left vertical band */}
        <div
          style={{
            width: 88 * S,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 24 * S,
            paddingBottom: 24 * S,
            color: INK_MUTED,
            fontFamily: 'NotoSerifTC, serif',
            fontWeight: 900,
            fontSize: 20 * S,
            letterSpacing: 2 * S,
            gap: 10 * S,
          }}
        >
          {verticalBandGlyphs.map((g, i) => (
            <div key={i} style={{ display: 'flex' }}>{g}</div>
          ))}
        </div>

        {/* Main area: center column + right QR column */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: `${44 * S}px ${56 * S}px ${44 * S}px ${8 * S}px`,
          }}
        >
          {/* Center column: eyebrow + station name + en + chip + bottom row */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22 * S,
                color: INK,
                fontFamily: 'NotoSerifTC, serif',
                fontWeight: 900,
                fontSize: 26 * S,
                letterSpacing: 18 * S,
              }}
            >
              <span style={{ display: 'flex' }}>此 站 有 緣</span>
              <div
                style={{
                  display: 'flex',
                  width: 14 * S,
                  height: 14 * S,
                  borderRadius: 999,
                  background: INK,
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                fontFamily: 'NotoSerifTC, serif',
                fontWeight: 900,
                fontSize: nameFontSize,
                color: INK,
                lineHeight: 1,
                letterSpacing: 8 * S,
                marginTop: 8 * S,
              }}
            >
              {pick.name_zh}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18 * S,
                marginTop: 16 * S,
              }}
            >
              {pick.name_en && (
                <span
                  style={{
                    display: 'flex',
                    fontFamily: 'NotoSerifTC, serif',
                    fontSize: 30 * S,
                    color: INK_MUTED,
                    letterSpacing: 8 * S,
                    fontStyle: 'italic',
                  }}
                >
                  {pick.name_en.toUpperCase()}
                </span>
              )}
              <span
                style={{
                  display: 'flex',
                  padding: `${6 * S}px ${16 * S}px`,
                  background: chipBg,
                  color: chipColor,
                  fontSize: 18 * S,
                  letterSpacing: 4 * S,
                  fontWeight: 500,
                }}
              >
                {chipLabel}
              </span>
            </div>

          </div>

          {/* Right column: QR + wordmark + stamp */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10 * S,
              flexShrink: 0,
              width: 220 * S,
              paddingLeft: 24 * S,
            }}
          >
            <span
              style={{
                display: 'flex',
                fontSize: 16 * S,
                letterSpacing: 6 * S,
                color: INK_MUTED,
              }}
            >
              同行 · SCAN
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUri}
              width={200 * S}
              height={200 * S}
              alt=""
              style={{
                border: `${1 * S}px solid ${RULE_STRONG}`,
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12 * S,
                marginTop: 4 * S,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  fontFamily: 'NotoSerifTC, serif',
                  fontWeight: 900,
                  fontSize: 36 * S,
                  color: INK,
                  letterSpacing: 6 * S,
                }}
              >
                坐火行
              </span>
              <div
                style={{
                  width: 84 * S,
                  height: 84 * S,
                  background: STAMP_RED,
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-6deg)',
                  fontFamily: 'NotoSerifTC, serif',
                  fontWeight: 900,
                  fontSize: 22 * S,
                  lineHeight: 1,
                  padding: 6 * S,
                }}
              >
                <div style={{ display: 'flex', gap: 10 * S }}>
                  <span style={{ display: 'flex' }}>此</span>
                  <span style={{ display: 'flex' }}>站</span>
                </div>
                <div style={{ display: 'flex', gap: 10 * S, marginTop: 8 * S }}>
                  <span style={{ display: 'flex' }}>有</span>
                  <span style={{ display: 'flex' }}>緣</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        <div style={{ display: 'flex', height: 2 * S, background: RULE_SOFT }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${16 * S}px ${56 * S}px ${20 * S}px`,
            fontSize: 18 * S,
            letterSpacing: 6 * S,
          }}
        >
          <span style={{ display: 'flex', color: INK, fontWeight: 500 }}>
            {dateLabel}
          </span>
          <span style={{ display: 'flex', color: SEAL }}>
            命中注定 · 做到哪就去哪
          </span>
        </div>
        <div style={{ display: 'flex', height: 2 * S, background: RULE_SOFT, marginBottom: 3 * S }} />
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'NotoSerifTC', data: serif, weight: 900, style: 'normal' },
        { name: 'NotoSansTC', data: sans, weight: 500, style: 'normal' },
        { name: 'JetBrainsMono', data: mono, weight: 500, style: 'normal' },
      ],
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, immutable',
      },
    },
  )
}
