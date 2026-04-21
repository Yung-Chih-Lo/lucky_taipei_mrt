import { NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db/client'
import { stationLines, stations } from '@/db/schema'
import { getSession } from '@/lib/session'

const CreateSchema = z.object({
  nameZh: z.string().min(1).max(100),
  nameEn: z.string().max(200).optional().nullable(),
  schematicX: z.number(),
  schematicY: z.number(),
  labelX: z.number().optional(),
  labelY: z.number().optional(),
  labelAnchor: z.enum(['start', 'middle', 'end']).default('middle'),
  lineCodes: z.array(z.string()).default([]),
})

async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return null
}

export async function POST(req: Request) {
  const unauth = await requireAdmin()
  if (unauth) return unauth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid body', details: parsed.error.issues[0] },
      { status: 400 },
    )
  }

  const db = getDb()
  const v = parsed.data
  const labelX = v.labelX ?? v.schematicX
  const labelY = v.labelY ?? v.schematicY
  const now = Date.now()

  try {
    const result = db.transaction((tx) => {
      const inserted = tx
        .insert(stations)
        .values({
          nameZh: v.nameZh,
          nameEn: v.nameEn ?? null,
          schematicX: v.schematicX,
          schematicY: v.schematicY,
          labelX,
          labelY,
          labelAnchor: v.labelAnchor,
          updatedAt: now,
        })
        .returning()
        .all()[0]
      for (const code of v.lineCodes) {
        tx.insert(stationLines).values({ stationId: inserted.id, lineCode: code }).run()
      }
      return inserted
    })
    return NextResponse.json({ ...result, lineCodes: v.lineCodes })
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return NextResponse.json({ error: `站名「${v.nameZh}」已存在` }, { status: 409 })
    }
    throw e
  }
}

function isUniqueConstraintError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const msg = (e as { message?: string }).message ?? ''
  return msg.includes('UNIQUE constraint failed')
}
