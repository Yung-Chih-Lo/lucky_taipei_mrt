import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'
import { NextResponse } from 'next/server'
import { getSqlite } from '@/db/client'
import { ticketNoFromToken } from '@/lib/ticketNumber'

export const runtime = 'nodejs'

type PickRow = {
  station_id: number
  transport_type: 'mrt' | 'tra'
  token: string
  picked_at: number
  name_zh: string
  name_en: string | null
  county: string | null
}

async function loadFont(relative: string): Promise<ArrayBuffer> {
  const p = path.join(process.cwd(), 'public', 'fonts', relative)
  const buf = await readFile(p)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export async function GET(
  req: Request,
  { params }: { params: { token: string } },
) {
  const sqlite = getSqlite()
  const pick = sqlite
    .prepare<[string], PickRow>(
      `SELECT p.station_id, p.transport_type, p.token, p.picked_at,
              s.name_zh, s.name_en, s.county
       FROM station_picks p
       JOIN stations s ON s.id = p.station_id
       WHERE p.token = ?`,
    )
    .get(params.token)

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
  const qrTarget = `${baseUrl}/comment?token=${encodeURIComponent(pick.token)}`
  const qrSvg = await QRCode.toString(qrTarget, {
    type: 'svg',
    margin: 1,
    color: { dark: '#1A1D2B', light: '#FFFBF0' },
  })
  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`

  const ticketNo = ticketNoFromToken(pick.token)
  const dateLabel = formatDate(pick.picked_at)
  const modeLabel = pick.transport_type === 'mrt' ? '捷運' : '台鐵'

  const nameLen = pick.name_zh.length
  const nameFontSize = nameLen <= 2 ? 160 : nameLen <= 4 ? 120 : 88

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 607,
          background: '#FFFBF0',
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 64px',
          fontFamily: 'NotoSansTC, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 18,
            borderBottom: '2px dashed rgba(26,29,43,0.22)',
          }}
        >
          <span
            style={{
              fontFamily: 'NotoSerifTC, serif',
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: 8,
              color: '#1A1D2B',
              display: 'flex',
            }}
          >
            坐火行
          </span>
          <span
            style={{
              fontFamily: 'JetBrainsMono, monospace',
              fontSize: 18,
              color: '#6B6557',
              letterSpacing: 4,
              display: 'flex',
            }}
          >
            No.{ticketNo}
          </span>
        </div>

        {/* Center */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 48,
            paddingTop: 28,
          }}
        >
          {/* Left: station info */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            <span
              style={{
                fontSize: 20,
                letterSpacing: 10,
                color: '#6B6557',
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              此 站 有 緣
            </span>
            <span
              style={{
                fontFamily: 'NotoSerifTC, serif',
                fontSize: nameFontSize,
                fontWeight: 900,
                color: '#1A1D2B',
                lineHeight: 1.05,
                letterSpacing: 6,
                display: 'flex',
                marginTop: 12,
              }}
            >
              {pick.name_zh}
            </span>
            {pick.name_en && (
              <span
                style={{
                  fontSize: 22,
                  color: '#6B6557',
                  letterSpacing: 6,
                  display: 'flex',
                  marginTop: 10,
                }}
              >
                {pick.name_en.toUpperCase()}
              </span>
            )}
            <span
              style={{
                fontSize: 20,
                color: '#1A1D2B',
                letterSpacing: 6,
                marginTop: 14,
                display: 'flex',
              }}
            >
              {pick.transport_type === 'tra'
                ? `${pick.county ?? ''} · 台鐵`
                : '台北捷運'}{' '}
              · {dateLabel}
            </span>
          </div>

          {/* Right: QR + stamp */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUri} width={170} height={170} alt="" />
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                border: '4px solid #C8954A',
                color: '#C8954A',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-8deg)',
                fontFamily: 'NotoSerifTC, serif',
              }}
            >
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  letterSpacing: 2,
                  display: 'flex',
                }}
              >
                {modeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 18,
            borderTop: '2px dashed rgba(26,29,43,0.22)',
            marginTop: 24,
            fontSize: 15,
            letterSpacing: 6,
            color: '#6B6557',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ display: 'flex' }}>命中注站 · 坐到哪算哪</span>
          <span style={{ display: 'flex' }}>ZUOHUO XING</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 607,
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
