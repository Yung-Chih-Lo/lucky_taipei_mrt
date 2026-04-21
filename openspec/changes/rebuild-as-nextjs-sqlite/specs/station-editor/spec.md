## ADDED Requirements

### Requirement: Admin can drag a station to update its schematic position
The admin editor SHALL let the admin drag a station's body within the SVG canvas. On drop, the system SHALL persist the new `schematic_x` and `schematic_y` by calling `PATCH /api/admin/stations/:id`.

#### Scenario: Successful drag-and-drop
- **WHEN** the admin drags a station body from `(100, 100)` to `(150, 120)` and releases
- **THEN** the request `PATCH /api/admin/stations/:id` SHALL fire with `{ schematic_x: 150, schematic_y: 120 }`
- **AND** on 200 response, the station SHALL remain at `(150, 120)` and the saved timestamp SHALL update
- **AND** the label SHALL move with the station by the same delta so the admin's mental model ("station + label move together unless I drag the label") is preserved

#### Scenario: Mutation fails
- **WHEN** the save request returns a non-2xx status
- **THEN** the station's on-screen position SHALL revert to its pre-drag coordinates
- **AND** an error toast SHALL surface the failure to the admin

### Requirement: Admin can drag a label independently of its station
The admin editor SHALL let the admin drag the label text for any station. On drop, the system SHALL persist the new `label_x` and `label_y` by calling `PATCH /api/admin/stations/:id`. Dragging a label SHALL NOT move the station body.

#### Scenario: Label drag
- **WHEN** the admin drags a label from `(540, 510)` to `(560, 500)` and releases
- **THEN** `PATCH /api/admin/stations/:id` SHALL fire with `{ label_x: 560, label_y: 500 }` (no station position fields)
- **AND** the station body SHALL remain at its previous schematic coordinates

### Requirement: Admin can change a label's anchor
The admin editor SHALL surface an anchor switcher that lets the admin set `label_anchor` to one of `start`, `middle`, or `end`. The switcher SHALL appear via a hover or click affordance on the label, and selection SHALL persist immediately via `PATCH /api/admin/stations/:id`.

#### Scenario: Anchor change
- **WHEN** the admin selects `end` from the anchor switcher for a station whose label currently uses `middle`
- **THEN** `PATCH /api/admin/stations/:id` SHALL fire with `{ label_anchor: 'end' }`
- **AND** the label SHALL re-render with `text-anchor="end"` on 200 response

#### Scenario: Invalid anchor value blocked client-side
- **WHEN** the admin UI attempts to set an anchor other than `start`, `middle`, or `end`
- **THEN** the UI SHALL NOT send the request
- **AND** the database SHALL NOT be modified

### Requirement: Admin can add a station by clicking empty canvas
The admin editor SHALL open an "add station" modal when the admin clicks on empty canvas space (not on an existing station or label). The modal SHALL collect `name_zh` (required), `name_en` (optional), and line memberships. On submit, the system SHALL create the station with `schematic_x`/`schematic_y` taken from the click location and default `label_x`/`label_y`/`label_anchor`.

#### Scenario: Valid add
- **WHEN** the admin clicks empty canvas at `(400, 300)` and submits `{ name_zh: '新站', lines: ['BL'] }`
- **THEN** `POST /api/admin/stations` SHALL fire with those fields plus `schematic_x: 400, schematic_y: 300`
- **AND** on 200 response, the new station SHALL appear at `(400, 300)` in the canvas
- **AND** a default label position SHALL be applied (e.g. same as station position with `label_anchor = 'middle'`) until the admin drags it

#### Scenario: Duplicate name
- **WHEN** the admin submits a `name_zh` that matches an existing station
- **THEN** the API SHALL respond 409 with a clear error
- **AND** the modal SHALL remain open displaying the error
- **AND** no row SHALL be inserted

### Requirement: Admin can edit or delete a station via its existing marker
Clicking an existing station body (not dragging) SHALL open an edit modal for that station. The modal SHALL expose fields for `name_zh`, `name_en`, line memberships, and a delete action.

#### Scenario: Edit and save
- **WHEN** the admin edits `name_en` from `Xindian` to `Xindian Station` and saves
- **THEN** `PATCH /api/admin/stations/:id` SHALL fire with `{ name_en: 'Xindian Station' }`
- **AND** the label text SHALL update on 200 response

#### Scenario: Delete
- **WHEN** the admin confirms deletion from the edit modal
- **THEN** `DELETE /api/admin/stations/:id` SHALL fire
- **AND** on 200 response, the station, its label, and any connections that referenced it SHALL disappear from the canvas

### Requirement: Admin changes are visible to public visitors after save
Once a mutation response returns 2xx, any subsequent page load by a public visitor SHALL reflect the change without redeployment.

#### Scenario: Public page after admin moves a station
- **WHEN** the admin successfully moves a station from `(100, 100)` to `(150, 120)`
- **AND** a public visitor subsequently loads `/`
- **THEN** the visitor SHALL see the station at `(150, 120)`

### Requirement: Admin UI blocks unauthenticated access client-side in addition to server-side
The `/admin` UI SHALL render only after the session is confirmed present. The absence of a session SHALL redirect to `/admin/login` before any editor component mounts.

#### Scenario: Direct navigation without session
- **WHEN** a visitor navigates to `/admin` without a valid session cookie
- **THEN** the server SHALL redirect to `/admin/login` (enforced by middleware)
- **AND** no editor component SHALL be included in the HTML response for that request

### Requirement: Admin can log out from the editor
The admin UI SHALL include a logout control that posts to `/api/auth/logout` and navigates back to `/` on success.

#### Scenario: Admin clicks logout
- **WHEN** the admin clicks the logout control
- **THEN** the client SHALL `POST /api/auth/logout`
- **AND** the admin SHALL be redirected to `/`
- **AND** subsequent direct navigation to `/admin` SHALL redirect to `/admin/login`
