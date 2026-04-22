## ADDED Requirements

### Requirement: Latest comment endpoint returns an excerpt for a given station
The system SHALL expose `GET /api/stations/[id]/latest-comment` that returns the most recent approved comment for the specified station. The response SHALL include a server-trimmed `excerpt` of at most 80 characters. If no comment exists for that station the endpoint SHALL return HTTP 204 with an empty body.

#### Scenario: Station has at least one comment
- **WHEN** a client calls `GET /api/stations/42/latest-comment`
- **AND** the `comments` table contains one or more rows with `station_id = 42`
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL be `{ excerpt: "<first 80 chars of the latest comment's content>" }`
- **AND** `excerpt` SHALL be ordered by `created_at DESC LIMIT 1`

#### Scenario: Excerpt truncation
- **WHEN** the latest comment's content exceeds 80 characters
- **THEN** the `excerpt` field SHALL contain exactly the first 80 characters of the content (no ellipsis appended by the server)

#### Scenario: Station has no comments
- **WHEN** a client calls `GET /api/stations/99/latest-comment`
- **AND** no `comments` row exists with `station_id = 99`
- **THEN** the response status SHALL be 204
- **AND** the response body SHALL be empty

#### Scenario: Unknown station id
- **WHEN** a client calls `GET /api/stations/999999/latest-comment`
- **AND** no station with that id exists
- **THEN** the response status SHALL be 404

### Requirement: Result page renders the relay message block when data is present
Both the MRT result component (`ResultDisplay`) and the TRA result component (`TraResultDisplay`) SHALL fetch and conditionally render a relay message block after the station name.

#### Scenario: Latest comment exists
- **WHEN** the result page mounts with a resolved station
- **AND** `GET /api/stations/[id]/latest-comment` returns HTTP 200
- **THEN** a relay message block SHALL be visible on the page
- **AND** the block SHALL display the `excerpt` text

#### Scenario: No comment available
- **WHEN** `GET /api/stations/[id]/latest-comment` returns HTTP 204
- **THEN** no relay message block SHALL be rendered
- **AND** no placeholder or empty-state text SHALL be shown

#### Scenario: Fetch error
- **WHEN** the fetch call fails (network error or non-2xx status other than 204)
- **THEN** the relay message block SHALL not be rendered
- **AND** no error message SHALL be shown to the user
