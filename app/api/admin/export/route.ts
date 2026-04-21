import { NextResponse } from 'next/server'
import { getDb } from '@/db/client'
import {
  canvasConfig,
  connections,
  lines,
  stationLines,
  stations,
} from '@/db/schema'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const dump = db.transaction((tx) => ({
    exportedAt: new Date().toISOString(),
    canvas: tx.select().from(canvasConfig).all(),
    lines: tx.select().from(lines).all(),
    stations: tx.select().from(stations).all(),
    stationLines: tx.select().from(stationLines).all(),
    connections: tx.select().from(connections).all(),
  }))

  return new NextResponse(JSON.stringify(dump, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="metro-backup-${Date.now()}.json"`,
    },
  })
}
