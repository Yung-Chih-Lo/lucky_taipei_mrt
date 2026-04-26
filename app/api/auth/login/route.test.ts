import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const verifyAdminCredentials = vi.fn()
const sessionSave = vi.fn()
const getSession = vi.fn(async () => {
  const session = { isAdmin: false, save: sessionSave }
  return session
})
const enforceRateLimit = vi.fn(() => ({ ok: true, remaining: 4 }))
const getClientIp = vi.fn(() => '1.2.3.4')

vi.mock('@/lib/auth', () => ({
  verifyAdminCredentials: (u: string, p: string) => verifyAdminCredentials(u, p),
}))

vi.mock('@/lib/session', () => ({
  getSession: () => getSession(),
}))

vi.mock('@/db/client', () => ({
  getSqlite: () => ({}),
}))

vi.mock('@/lib/community/rate-limit', () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimit(...args),
  getClientIp: (h: Headers) => getClientIp(h),
}))

const ADMIN_USERNAME = 'secret-admin-handle'
const ADMIN_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c2VjcmV0LXNhbHQ$abcdef0123456789abcdef0123456789abcdef0123'

const SUBMITTED_PASSWORD = 'My$uperSecret-p4ssword!!'

const logSpies: Array<ReturnType<typeof vi.spyOn>> = []

function allLoggedStrings(): string[] {
  return logSpies.flatMap((spy) =>
    spy.mock.calls.flatMap((call) =>
      call.map((arg) => {
        try {
          return typeof arg === 'string' ? arg : JSON.stringify(arg)
        } catch {
          return String(arg)
        }
      }),
    ),
  )
}

function assertNoCredentialLeak(submittedUsername: string, submittedPassword: string) {
  const all = allLoggedStrings().join('\n')
  expect(all, 'log output must not contain ADMIN_USERNAME').not.toContain(ADMIN_USERNAME)
  expect(all, 'log output must not contain ADMIN_PASSWORD_HASH').not.toContain(
    ADMIN_PASSWORD_HASH,
  )
  expect(all, 'log output must not contain any 4+ char prefix of ADMIN_PASSWORD_HASH').not.toContain(
    ADMIN_PASSWORD_HASH.slice(0, 8),
  )
  expect(all, 'log output must not contain submitted username').not.toContain(submittedUsername)
  expect(all, 'log output must not contain submitted password').not.toContain(submittedPassword)
  expect(all.toLowerCase(), 'log output must not contain the substring "password"').not.toContain(
    'password',
  )
}

beforeEach(() => {
  process.env.ADMIN_USERNAME = ADMIN_USERNAME
  process.env.ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH
  process.env.SESSION_SECRET = 'x'.repeat(40)

  verifyAdminCredentials.mockReset()
  sessionSave.mockReset()
  getSession.mockClear()
  enforceRateLimit.mockReturnValue({ ok: true, remaining: 4 })
  getClientIp.mockReturnValue('1.2.3.4')

  logSpies.push(vi.spyOn(console, 'log').mockImplementation(() => {}))
  logSpies.push(vi.spyOn(console, 'info').mockImplementation(() => {}))
  logSpies.push(vi.spyOn(console, 'warn').mockImplementation(() => {}))
  logSpies.push(vi.spyOn(console, 'error').mockImplementation(() => {}))
  logSpies.push(vi.spyOn(console, 'debug').mockImplementation(() => {}))
})

afterEach(() => {
  while (logSpies.length) logSpies.pop()?.mockRestore()
  vi.resetModules()
})

describe('POST /api/auth/login', () => {
  it('does not log credential material on a successful login', async () => {
    verifyAdminCredentials.mockResolvedValue(true)
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: ADMIN_USERNAME, password: SUBMITTED_PASSWORD }),
      }),
    )

    expect(res.status).toBe(200)
    assertNoCredentialLeak(ADMIN_USERNAME, SUBMITTED_PASSWORD)
  })

  it('does not log credential material on a failed login', async () => {
    verifyAdminCredentials.mockResolvedValue(false)
    const { POST } = await import('./route')

    const submittedUser = 'guessed-user'
    const res = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: submittedUser, password: SUBMITTED_PASSWORD }),
      }),
    )

    expect(res.status).toBe(401)
    assertNoCredentialLeak(submittedUser, SUBMITTED_PASSWORD)
  })

  it('does not log credential material on a malformed JSON body', async () => {
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not-json-at-all',
      }),
    )

    expect(res.status).toBe(400)
    assertNoCredentialLeak('n/a', 'n/a')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    enforceRateLimit.mockReturnValue({ ok: false, remaining: 0 })
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'any', password: 'any' }),
      }),
    )

    expect(res.status).toBe(429)
    expect(verifyAdminCredentials).not.toHaveBeenCalled()
  })
})
