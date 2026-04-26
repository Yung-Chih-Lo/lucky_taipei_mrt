import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAdminCredentials } from '@/lib/auth'
import { getSession } from '@/lib/session'
import { getSqlite } from '@/db/client'
import { enforceRateLimit, getClientIp } from '@/lib/community/rate-limit'

const BodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const ip = getClientIp(req.headers)
  const limit = enforceRateLimit(getSqlite(), ip, 'auth')
  if (!limit.ok) {
    return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 })
  }

  const ok = await verifyAdminCredentials(parsed.data.username, parsed.data.password)
  if (!ok) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const session = await getSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ ok: true })
}
