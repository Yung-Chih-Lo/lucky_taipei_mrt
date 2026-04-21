import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db/client'
import { stationLines, stations } from '@/db/schema'
import { getSession } from '@/lib/session'

const PatchSchema = z
  .object({
    nameZh: z.string().min(1).max(100).optional(),
    nameEn: z.string().max(200).nullable().optional(),
    schematicX: z.number().optional(),
    schematicY: z.number().optional(),
    labelX: z.number().optional(),
    labelY: z.number().optional(),
    labelAnchor: z.enum(['start', 'middle', 'end']).optional(),
    lineCodes: z.array(z.string()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'no fields to update' })

async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return null
}

function parseId(idParam: string): number | null {
  const n = Number.parseInt(idParam, 10)
  return Number.isFinite(n) ? n : null
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin()
  if (unauth) return unauth

  const { id: idParam } = await ctx.params
  const id = parseId(idParam)
  if (id == null) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid body', details: parsed.error.issues[0] },
      { status: 400 },
    )
  }

  const db = getDb()
  const now = Date.now()
  const v = parsed.data

  try {
    const updated = db.transaction((tx) => {
      const existing = tx.select().from(stations).where(eq(stations.id, id)).get()
      if (!existing) return null

      const patch: Record<string, unknown> = { updatedAt: now }
      if (v.nameZh !== undefined) patch.nameZh = v.nameZh
      if (v.nameEn !== undefined) patch.nameEn = v.nameEn
      if (v.schematicX !== undefined) patch.schematicX = v.schematicX
      if (v.schematicY !== undefined) patch.schematicY = v.schematicY
      if (v.labelX !== undefined) patch.labelX = v.labelX
      if (v.labelY !== undefined) patch.labelY = v.labelY
      if (v.labelAnchor !== undefined) patch.labelAnchor = v.labelAnchor

      const row = tx.update(stations).set(patch).where(eq(stations.id, id)).returning().all()[0]

      if (v.lineCodes !== undefined) {
        tx.delete(stationLines).where(eq(stationLines.stationId, id)).run()
        for (const code of v.lineCodes) {
          tx.insert(stationLines).values({ stationId: id, lineCode: code }).run()
        }
      }
      return row
    })

    if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const lineCodes = db
      .select({ code: stationLines.lineCode })
      .from(stationLines)
      .where(eq(stationLines.stationId, id))
      .all()
      .map((r) => r.code)
    return NextResponse.json({ ...updated, lineCodes })
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return NextResponse.json({ error: '站名已存在' }, { status: 409 })
    }
    throw e
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin()
  if (unauth) return unauth

  const { id: idParam } = await ctx.params
  const id = parseId(idParam)
  if (id == null) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const db = getDb()
  const deleted = db.delete(stations).where(eq(stations.id, id)).returning().all()
  if (deleted.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true, id })
}

function isUniqueConstraintError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const msg = (e as { message?: string }).message ?? ''
  return msg.includes('UNIQUE constraint failed')
}
