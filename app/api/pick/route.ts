import { NextResponse } from 'next/server'
import { getSqlite } from '@/db/client'
import { pickRequestSchema } from '@/lib/community/validators'
import { enforceRateLimit, getClientIp } from '@/lib/community/rate-limit'
import { pickMrt, pickTra, lookupMrtStation, type PickedStation } from '@/lib/community/pick'
import { generateToken } from '@/lib/community/token'

const TOKEN_RETRY_LIMIT = 3

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = pickRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', details: parsed.error.issues[0] },
      { status: 400 },
    )
  }

  const sqlite = getSqlite()
  const ip = getClientIp(req.headers)
  const limit = enforceRateLimit(sqlite, ip, 'pick')
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let station: PickedStation | null
  if (parsed.data.transport_type === 'mrt') {
    if (parsed.data.station_id) {
      station = lookupMrtStation(sqlite, parsed.data.station_id)
    } else {
      station = pickMrt(sqlite, { lineCodes: parsed.data.filter?.line_codes })
    }
  } else {
    station = pickTra(sqlite, { counties: parsed.data.filter.counties })
  }

  if (!station) {
    return NextResponse.json({ error: 'no_candidates' }, { status: 422 })
  }

  const insert = sqlite.prepare(
    `INSERT INTO station_picks (station_id, transport_type, token, picked_at, comment_used)
     VALUES (?, ?, ?, ?, 0)`,
  )

  let token: string | null = null
  for (let attempt = 0; attempt < TOKEN_RETRY_LIMIT; attempt++) {
    const candidate = generateToken()
    try {
      insert.run(station.id, station.transportType, candidate, Date.now())
      token = candidate
      break
    } catch (err) {
      if (!isUniqueError(err)) throw err
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'token_collision' }, { status: 500 })
  }

  const countRow = sqlite
    .prepare<[number], { n: number }>(
      'SELECT COUNT(*) AS n FROM comments WHERE station_id = ?',
    )
    .get(station.id)
  const comment_count = countRow?.n ?? 0

  return NextResponse.json({ token, station, comment_count })
}

function isUniqueError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const msg = (err as { message?: string }).message ?? ''
  return msg.includes('UNIQUE constraint failed')
}
