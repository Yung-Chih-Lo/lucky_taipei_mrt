import 'server-only'
import { cookies } from 'next/headers'
import { getIronSession, type SessionOptions } from 'iron-session'
import { SESSION_COOKIE_NAME, type SessionData } from './session-shared'

export { SESSION_COOKIE_NAME, type SessionData }

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET
  if (!password || password.length < 32) {
    throw new Error(
      'SESSION_SECRET env var must be set and at least 32 characters long.',
    )
  }
  return {
    password,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    },
  }
}

export async function getSession() {
  const store = await cookies()
  return getIronSession<SessionData>(store, getSessionOptions())
}
