import 'server-only'
import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let cached: DrizzleDb | null = null

export function getDb(): DrizzleDb {
  if (cached) return cached

  const dbPath = process.env.DATABASE_PATH
  if (!dbPath) {
    throw new Error(
      'DATABASE_PATH is not set. Configure it (e.g. DATABASE_PATH=./data/metro.db) before starting the server.',
    )
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  cached = drizzle(sqlite, { schema })
  return cached
}
