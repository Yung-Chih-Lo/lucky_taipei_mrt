import { NextResponse, type NextRequest } from 'next/server'
import { unsealData } from 'iron-session'
import { SESSION_COOKIE_NAME, type SessionData } from '../lib/session-shared'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (path === '/admin/login' || path.startsWith('/admin/login/')) {
    return NextResponse.next()
  }

  const authed = await isAuthenticated(req)
  if (authed) return NextResponse.next()

  if (path.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('from', path)
  return NextResponse.redirect(url)
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const password = process.env.SESSION_SECRET
  if (!password) return false
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!cookie) return false
  try {
    const data = await unsealData<SessionData>(cookie, { password })
    return !!data?.isAdmin
  } catch {
    return false
  }
}
