## ADDED Requirements

### Requirement: Map is rendered as SVG from schematic coordinates
The system SHALL render the metro map as an `<svg>` element whose `viewBox` is `0 0 <canvas.width> <canvas.height>`. Station positions SHALL come from `stations.schematic_x` and `stations.schematic_y`. Label positions SHALL come from `stations.label_x` and `stations.label_y` with text anchor from `stations.label_anchor`. Leaflet, tile layers, and geographic lat/lng SHALL NOT participate in rendering.

#### Scenario: Station position reflects schematic coordinates
- **WHEN** the map renders a station with `schematic_x = 530`, `schematic_y = 525`
- **THEN** the SVG SHALL contain a station mark whose center is at `x=530, y=525` in the canvas coordinate space

#### Scenario: Label position is independent of station position
- **WHEN** the map renders a station with `schematic_x = 530`, `schematic_y = 525`, `label_x = 540`, `label_y = 510`, `label_anchor = 'start'`
- **THEN** the SVG SHALL contain a `<text>` element with `x=540 y=510 text-anchor=start` showing the station name
- **AND** the station mark SHALL remain at `(530, 525)`

#### Scenario: `lat`/`lng` are absent but rendering still works
- **WHEN** a station row has `lat` and `lng` both NULL
- **THEN** the station SHALL still render at its schematic coordinates without warnings

### Requirement: Connection segments render per line with correct colour
Each row in `connections` SHALL produce a single SVG `<path>` whose `d` attribute is reconstructed from the row's stored `path_json` (a sequence of `{command, coordinates}` entries using `M`, `L`, and `Q` commands). The path SHALL be stroked with the colour from `lines.color` for that `line_code`.

#### Scenario: Straight connection
- **WHEN** a connection row has `path_json = [{command:'M', coordinates:[100,100]}, {command:'L', coordinates:[200,100]}]` on line `BL` (color `#0070bd`)
- **THEN** the SVG SHALL contain a `<path>` with `d="M 100 100 L 200 100"` stroked in `#0070bd`

#### Scenario: Curved connection
- **WHEN** a connection row's `path_json` contains a `Q` command
- **THEN** the rendered `d` attribute SHALL use the same `Q` command with its coordinates preserved so the bend renders as a quadratic Bézier

#### Scenario: Missing endpoint
- **WHEN** a connection row references a `from_station_id` or `to_station_id` that no longer exists
- **THEN** the renderer SHALL skip that segment and SHALL NOT throw

### Requirement: Line filter dims unselected lines
When one or more lines are selected via the public sidebar, segments and stations belonging to unselected lines SHALL be rendered with reduced opacity. When no lines are selected, all elements render at full opacity (or a default opacity).

#### Scenario: User selects a subset of lines
- **WHEN** the user selects lines `{R, G}` in the sidebar
- **THEN** segments for lines `R` and `G` SHALL render at full opacity
- **AND** segments for other lines SHALL render at a reduced opacity
- **AND** stations that belong to at least one selected line SHALL render at full opacity
- **AND** stations that belong to no selected line SHALL render at reduced opacity

#### Scenario: User clears the line filter
- **WHEN** the user deselects all lines
- **THEN** all segments and stations SHALL render at their default opacity

### Requirement: Lottery animation hops through intermediate stations
The public picker SHALL animate a "train" marker that visits several intermediate stations before landing on the final chosen station. The animation SHALL operate in SVG schematic coordinates.

#### Scenario: Animation from pool of stations
- **WHEN** the user triggers a pick with a pool of eligible stations
- **THEN** the renderer SHALL sequentially position the train marker at ~12 intermediate stations drawn from the pool
- **AND** the marker SHALL finish on the designated final station
- **AND** on completion, the picker SHALL notify the caller so the result modal can open

#### Scenario: Animation interrupted by a new pick
- **WHEN** the user triggers a second pick while the previous animation is still running
- **THEN** the previous animation SHALL stop
- **AND** the new animation SHALL begin from a consistent starting state without leaving stray markers on the canvas

### Requirement: Rendering is responsive to canvas dimensions
The SVG SHALL scale to fit its parent container while preserving aspect ratio using `preserveAspectRatio="xMidYMid meet"` on the configured `viewBox`.

#### Scenario: Container shrinks on a small screen
- **WHEN** the SVG's parent container is 320px wide and the canvas width is 800
- **THEN** the map SHALL render at the available width with proportionally scaled height
- **AND** no station or label SHALL be clipped due to the scaling itself

### Requirement: Renderer exposes interaction hooks for admin mode
The same SVG component SHALL accept optional props that enable admin interactions: a station drag handler, a label drag handler, a label-anchor-change handler, a map-background click handler (for adding stations), and a station click handler (for opening an edit panel). When these props are absent (public mode), no drag handles or edit affordances SHALL be rendered.

#### Scenario: Public mode
- **WHEN** the renderer is used without admin handlers
- **THEN** stations and labels SHALL render as read-only
- **AND** no draggable affordances, no anchor switcher, and no "add station" click target SHALL be exposed

#### Scenario: Admin mode
- **WHEN** the renderer is used with all admin handlers supplied
- **THEN** each station SHALL render two distinguishable drag targets (station body and label text)
- **AND** clicks on empty canvas area SHALL invoke the add-station handler with the click's canvas-space coordinates
