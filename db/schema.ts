import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const lines = sqliteTable('lines', {
  code: text('code').primaryKey(),
  nameZh: text('name_zh'),
  nameEn: text('name_en'),
  color: text('color').notNull(),
})

export const stations = sqliteTable(
  'stations',
  {
    id: integer('id').primaryKey(),
    nameZh: text('name_zh').notNull().unique(),
    nameEn: text('name_en'),
    lat: real('lat'),
    lng: real('lng'),
    schematicX: real('schematic_x').notNull(),
    schematicY: real('schematic_y').notNull(),
    labelX: real('label_x').notNull(),
    labelY: real('label_y').notNull(),
    labelAnchor: text('label_anchor', { enum: ['start', 'middle', 'end'] }).notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => ({
    labelAnchorCheck: check(
      'stations_label_anchor_check',
      sql`${t.labelAnchor} IN ('start','middle','end')`,
    ),
  }),
)

export const stationLines = sqliteTable(
  'station_lines',
  {
    stationId: integer('station_id')
      .notNull()
      .references(() => stations.id, { onDelete: 'cascade' }),
    lineCode: text('line_code')
      .notNull()
      .references(() => lines.code),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.stationId, t.lineCode] }),
  }),
)

export const connections = sqliteTable('connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromStationId: integer('from_station_id')
    .notNull()
    .references(() => stations.id, { onDelete: 'cascade' }),
  toStationId: integer('to_station_id')
    .notNull()
    .references(() => stations.id, { onDelete: 'cascade' }),
  lineCode: text('line_code')
    .notNull()
    .references(() => lines.code),
  pathJson: text('path_json').notNull(),
})

export const canvasConfig = sqliteTable(
  'canvas_config',
  {
    id: integer('id').primaryKey(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
  },
  (t) => ({
    singleton: check('canvas_config_singleton', sql`${t.id} = 1`),
  }),
)

export type Station = typeof stations.$inferSelect
export type NewStation = typeof stations.$inferInsert
export type Line = typeof lines.$inferSelect
export type Connection = typeof connections.$inferSelect
export type ConnectionPathPoint = {
  command: 'M' | 'L' | 'Q'
  coordinates: number[]
}
