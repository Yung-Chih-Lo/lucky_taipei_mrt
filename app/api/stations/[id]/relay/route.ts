import { NextResponse } from 'next/server'
import { getSqlite } from '@/db/client'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const stationId = parseInt(id, 10)
  if (isNaN(stationId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  const sqlite = getSqlite()

  const station = sqlite
    .prepare('SELECT id FROM stations WHERE id = ?')
    .get(stationId)
  if (!station) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const row = sqlite
    .prepare(
      `SELECT content FROM comments
       WHERE station_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .get(stationId) as { content: string } | undefined

  if (!row) {
    return NextResponse.json({ excerpt: null })
  }

  const content = row.content
  const excerpt = content.length > 50 ? content.slice(0, 50) + '…' : content
  return NextResponse.json({ excerpt })
}
