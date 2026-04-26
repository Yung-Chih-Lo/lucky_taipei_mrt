import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const lines = sqliteTable(
  'lines',
  {
    code: text('code').primaryKey(),
    transportType: text('transport_type').notNull(),
    nameZh: text('name_zh'),
    nameEn: text('name_en'),
    color: text('color').notNull(),
  },
  (t) => ({
    transportTypeCheck: check(
      'lines_transport_type_check',
      sql`${t.transportType} IN ('mrt','tra')`,
    ),
  }),
)

export const stations = sqliteTable(
  'stations',
  {
    id: integer('id').primaryKey(),
    transportType: text('transport_type').notNull(),
    nameZh: text('name_zh').notNull(),
    nameEn: text('name_en'),
    county: text('county'),
    lat: real('lat'),
    lng: real('lng'),
    schematicX: real('schematic_x'),
    schematicY: real('schematic_y'),
    labelX: real('label_x'),
    labelY: real('label_y'),
    labelAnchor: text('label_anchor', { enum: ['start', 'middle', 'end'] }),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => ({
    transportTypeCheck: check(
      'stations_transport_type_check',
      sql`${t.transportType} IN ('mrt','tra')`,
    ),
    labelAnchorCheck: check(
      'stations_label_anchor_check',
      sql`${t.labelAnchor} IS NULL OR ${t.labelAnchor} IN ('start','middle','end')`,
    ),
    uniqMrtName: uniqueIndex('uniq_mrt_name')
      .on(t.nameZh)
      .where(sql`${t.transportType} = 'mrt'`),
    uniqTraNameCounty: uniqueIndex('uniq_tra_name_county')
      .on(t.nameZh, t.county)
      .where(sql`${t.transportType} = 'tra'`),
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

export const stationPicks = sqliteTable(
  'station_picks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    stationId: integer('station_id')
      .notNull()
      .references(() => stations.id, { onDelete: 'cascade' }),
    transportType: text('transport_type').notNull(),
    token: text('token').notNull(),
    pickedAt: integer('picked_at').notNull(),
    commentUsed: integer('comment_used').notNull().default(0),
  },
  (t) => ({
    transportTypeCheck: check(
      'station_picks_transport_type_check',
      sql`${t.transportType} IN ('mrt','tra')`,
    ),
    tokenUnique: uniqueIndex('idx_station_picks_token').on(t.token),
    stationIdIdx: index('idx_station_picks_station_id').on(t.stationId),
    transportTypeIdx: index('idx_station_picks_transport_type').on(t.transportType),
  }),
)

export const comments = sqliteTable(
  'comments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pickId: integer('pick_id')
      .notNull()
      .references(() => stationPicks.id, { onDelete: 'cascade' }),
    stationId: integer('station_id')
      .notNull()
      .references(() => stations.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    stationIdIdx: index('idx_comments_station_id').on(t.stationId),
    createdAtIdx: index('idx_comments_created_at').on(t.createdAt),
  }),
)

export const rateLimits = sqliteTable(
  'rate_limits',
  {
    ip: text('ip').notNull(),
    windowStart: text('window_start').notNull(),
    scope: text('scope').notNull(),
    count: integer('count').notNull().default(1),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ip, t.windowStart, t.scope] }),
    scopeCheck: check('rate_limits_scope_check', sql`${t.scope} IN ('pick','comment','auth')`),
    windowIdx: index('idx_rate_limits_window').on(t.windowStart),
  }),
)

export type Station = typeof stations.$inferSelect
export type NewStation = typeof stations.$inferInsert
export type Line = typeof lines.$inferSelect
export type Connection = typeof connections.$inferSelect
export type StationPick = typeof stationPicks.$inferSelect
export type Comment = typeof comments.$inferSelect
export type RateLimit = typeof rateLimits.$inferSelect
export type ConnectionPathPoint = {
  command: 'M' | 'L' | 'Q'
  coordinates: number[]
}
export type TransportType = 'mrt' | 'tra'
