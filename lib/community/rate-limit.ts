import type Database from 'better-sqlite3'

export type RateScope = 'pick' | 'comment' | 'auth'

type Granularity = 'minute' | 'hour' | '15min'

const LIMITS: Record<RateScope, { max: number; granularity: Granularity }> = {
  pick: { max: 5, granularity: 'minute' },
  comment: { max: 10, granularity: 'hour' },
  auth: { max: 5, granularity: '15min' },
}

export function getClientIp(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function windowKey(now: Date, granularity: Granularity): string {
  const iso = now.toISOString()
  if (granularity === 'minute') return iso.slice(0, 16)
  if (granularity === 'hour') return iso.slice(0, 13)
  const bucket = Math.floor(now.getUTCMinutes() / 15) * 15
  return `${iso.slice(0, 13)}:${String(bucket).padStart(2, '0')}`
}

function pruneCutoff(now: Date, granularity: Granularity): string {
  const ms =
    granularity === 'minute' ? 2 * 60 * 1000
    : granularity === '15min' ? 30 * 60 * 1000
    : 2 * 60 * 60 * 1000
  return windowKey(new Date(now.getTime() - ms), granularity)
}

export type RateLimitResult = { ok: boolean; remaining: number }

export function enforceRateLimit(
  sqlite: Database.Database,
  ip: string,
  scope: RateScope,
  now: Date = new Date(),
): RateLimitResult {
  const { max, granularity } = LIMITS[scope]
  const window = windowKey(now, granularity)
  const cutoff = pruneCutoff(now, granularity)

  const tx = sqlite.transaction((): RateLimitResult => {
    sqlite
      .prepare('DELETE FROM rate_limits WHERE scope = ? AND window_start < ?')
      .run(scope, cutoff)

    const existing = sqlite
      .prepare(
        'SELECT count FROM rate_limits WHERE ip = ? AND window_start = ? AND scope = ?',
      )
      .get(ip, window, scope) as { count: number } | undefined

    const current = existing?.count ?? 0
    if (current >= max) {
      return { ok: false, remaining: 0 }
    }

    if (existing) {
      sqlite
        .prepare(
          'UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND window_start = ? AND scope = ?',
        )
        .run(ip, window, scope)
    } else {
      sqlite
        .prepare(
          'INSERT INTO rate_limits (ip, window_start, scope, count) VALUES (?, ?, ?, 1)',
        )
        .run(ip, window, scope)
    }

    return { ok: true, remaining: max - (current + 1) }
  })

  return tx()
}
