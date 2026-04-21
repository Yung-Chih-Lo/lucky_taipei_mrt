## ADDED Requirements

### Requirement: SQLite schema for metro data
The system SHALL persist metro data in a SQLite database accessed via Drizzle ORM. The schema SHALL include tables `stations`, `lines`, `station_lines`, `connections`, and `canvas_config` as specified in the design document.

#### Scenario: Fresh database migration
- **WHEN** migrations run against an empty database
- **THEN** all five tables SHALL exist with the columns, primary keys, foreign keys, and CHECK constraints described in `design.md` Decision D7
- **AND** `canvas_config` SHALL enforce singleton via `CHECK (id = 1)`

#### Scenario: Station uniqueness
- **WHEN** an insert attempts to create a station whose `name_zh` matches an existing row
- **THEN** the insert SHALL fail with a uniqueness constraint error

#### Scenario: Station deletion cascades to associations
- **WHEN** a station row is deleted
- **THEN** all `station_lines` rows referencing that station SHALL be deleted
- **AND** all `connections` rows referencing that station as `from_station_id` or `to_station_id` SHALL be deleted

### Requirement: Label anchor constrained at the database level
The `stations.label_anchor` column SHALL accept only the values `start`, `middle`, or `end`.

#### Scenario: Invalid label anchor on insert or update
- **WHEN** a write attempts to set `label_anchor` to any value other than `start`, `middle`, or `end`
- **THEN** the write SHALL fail with a CHECK constraint error

### Requirement: Database location is configurable via environment
The path to the SQLite file SHALL be read from the `DATABASE_PATH` environment variable. The application SHALL NOT hardcode absolute paths to the database file.

#### Scenario: `DATABASE_PATH` points to a writable location
- **WHEN** the server starts with `DATABASE_PATH=/data/metro.db` and `/data` is writable
- **THEN** the server SHALL open or create the SQLite file at that path

#### Scenario: `DATABASE_PATH` is unset
- **WHEN** the server starts without `DATABASE_PATH` set
- **THEN** the process SHALL fail fast with a clear error identifying the missing variable

### Requirement: One-time seed script imports existing JSON
The system SHALL provide a standalone script, runnable as `npm run seed`, that imports `src/data/metroData.json` (or a path passed as an argument) into the configured SQLite database. The script SHALL be idempotent: running it against an already-seeded database SHALL NOT duplicate rows and SHALL NOT fail.

#### Scenario: First run against empty database
- **WHEN** `npm run seed` runs against an empty database
- **THEN** all stations, lines, station-line memberships, and connections from the JSON SHALL be inserted
- **AND** `canvas_config` SHALL be populated from the JSON's top-level `size` field
- **AND** each station's `schematic_x`/`schematic_y` SHALL be sourced from the JSON's `center.x`/`center.y`
- **AND** each station's `label_x`/`label_y`/`label_anchor` SHALL be sourced from the JSON's `name.pos.x`/`name.pos.y`/`name.pos.anchor`
- **AND** each station's `lat`/`lng` SHALL be populated when present in the JSON

#### Scenario: Re-run against populated database
- **WHEN** `npm run seed` runs against a database that already contains the same data
- **THEN** no duplicate rows SHALL be created
- **AND** the script SHALL exit successfully

### Requirement: Public read access uses server components, not a REST endpoint
The public page SHALL query the database directly from a React Server Component using Drizzle. A public `/api/stations` GET endpoint SHALL NOT exist in this iteration.

#### Scenario: Visitor loads the public page
- **WHEN** a visitor requests `/`
- **THEN** the HTML sent by the server SHALL already contain the station data needed for the initial render
- **AND** no client-side fetch SHALL be issued to load station data on first paint

### Requirement: Admin mutations go through Route Handlers under `/api/admin/`
Each station mutation (create, update, delete) SHALL be exposed as a Route Handler under `/api/admin/stations`. Each handler SHALL re-verify the session cookie before executing any database write, independent of middleware.

#### Scenario: Authenticated PATCH
- **WHEN** an authenticated client sends `PATCH /api/admin/stations/:id` with a valid partial payload
- **THEN** the targeted row SHALL be updated
- **AND** `updated_at` SHALL be set to the current time in unix milliseconds
- **AND** the response SHALL be 200 with the updated row

#### Scenario: Unauthenticated mutation
- **WHEN** a client without a valid session cookie calls any `/api/admin/stations` handler
- **THEN** the response SHALL be 401
- **AND** the database SHALL NOT be modified

#### Scenario: Invalid payload
- **WHEN** an authenticated client sends a payload that fails schema validation (for example, `label_anchor` outside `{start, middle, end}`, or `schematic_x` that is not a number)
- **THEN** the response SHALL be 400 with a JSON error body describing the first invalid field
- **AND** the database SHALL NOT be modified

### Requirement: Database file is safe to back up while running
Admin SHALL be able to copy the SQLite file off the volume without corruption via a dedicated export route that performs an online backup.

#### Scenario: Admin requests a backup dump
- **WHEN** an authenticated admin requests `GET /api/admin/export`
- **THEN** the response SHALL be a downloadable JSON dump containing all tables' contents
- **AND** the dump SHALL be generated using a consistent read (a single transaction)
