/* Standalone assertion: seeding twice yields identical row counts.
   Run via: DATABASE_PATH=./data/test-seed.db tsx scripts/test-seed-idempotency.ts */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import Database from 'better-sqlite3'

const dbPath = process.env.DATABASE_PATH ?? './data/test-seed.db'
const migrationDir = './drizzle'

// Fresh DB
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
fs.rmSync(dbPath, { force: true })
fs.rmSync(dbPath + '-journal', { force: true })
fs.rmSync(dbPath + '-wal', { force: true })
fs.rmSync(dbPath + '-shm', { force: true })

// Apply migrations
const env = { ...process.env, DATABASE_PATH: dbPath }
execSync('npx drizzle-kit migrate', { env, stdio: 'inherit' })

function countAll() {
  const sqlite = new Database(dbPath, { readonly: true })
  const q = (t: string) => (sqlite.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n
  const counts = {
    stations: q('stations'),
    lines: q('lines'),
    stationLines: q('station_lines'),
    connections: q('connections'),
    canvas: q('canvas_config'),
  }
  sqlite.close()
  return counts
}

// First seed
execSync('tsx scripts/seed.ts', { env, stdio: 'inherit' })
const after1 = countAll()

// Second seed
execSync('tsx scripts/seed.ts', { env, stdio: 'inherit' })
const after2 = countAll()

assert.deepEqual(after1, after2, 'seed should be idempotent')
assert.ok(after1.stations > 0, 'seed should populate stations')
assert.ok(after1.connections > 0, 'seed should populate connections')
assert.equal(after1.canvas, 1, 'canvas_config should have exactly one row')

console.log('✓ seed idempotency OK:', after1)

// Cleanup
fs.rmSync(dbPath, { force: true })
fs.rmSync(dbPath + '-journal', { force: true })
fs.rmSync(dbPath + '-wal', { force: true })
fs.rmSync(dbPath + '-shm', { force: true })
