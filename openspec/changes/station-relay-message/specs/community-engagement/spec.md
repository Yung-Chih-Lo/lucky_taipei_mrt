## ADDED Requirements

### Requirement: Station-scoped latest comment query path
The system SHALL support a dedicated read path that retrieves the single most recent comment for a given station id directly from the `comments` table using `station_id = ? ORDER BY created_at DESC LIMIT 1`. This path SHALL be exercised exclusively by the `GET /api/stations/[id]/latest-comment` endpoint defined in the `station-relay` capability and SHALL NOT alter any existing write or token-validation behaviour.

#### Scenario: Query isolation from existing comment list endpoint
- **WHEN** `GET /api/stations/[id]/latest-comment` is called
- **THEN** it SHALL NOT share implementation with or delegate to `GET /api/comments`
- **AND** no change to the behaviour of `GET /api/comments`, `POST /api/comments/[token]`, or `GET /api/comments/[token]` SHALL occur
