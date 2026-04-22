## MODIFIED Requirements

### Requirement: Ticket image contains the signature lockup
The generated ticket PNG SHALL contain, at minimum:
- The station name lockup in Noto Serif TC weight 900 (the largest element, occupying ≥30% of the canvas height).
- The English name (if available) in a smaller weight above the Chinese name.
- The 籤號 `No.XXXX` rendered in JetBrains Mono (or a monospace fallback).
- The pick date in `YYYY.MM.DD` format.
- The seal mark in `--seal` color containing the mode label (`捷運` or `台鐵`).
- The brand wordmark `下一站 · 幸運車站` in small caption type.
- A QR code pointing to the comment page for this pick: `/comment?token={token}`.
- The kerf-edge treatment (dashed top and bottom) so the image reads as a ticket stub.

The ticket SHALL NOT contain any emoji characters.

#### Scenario: Chinese station name is present and dominant
- **WHEN** a ticket is generated for a pick whose station's `nameZh` is "七堵"
- **THEN** the generated PNG SHALL render the text "七堵"
- **AND** that text element SHALL be the largest text on the canvas

#### Scenario: 籤號 and date are present
- **WHEN** a ticket is generated for a pick created on `2026-04-22` with an issued 籤號 `0428`
- **THEN** the PNG SHALL contain the text `No.0428`
- **AND** the PNG SHALL contain the text `2026.04.22`

#### Scenario: Seal mark carries the mode label
- **WHEN** a ticket is generated for a pick whose `transport_type` is `tra`
- **THEN** the seal mark SHALL contain the text `台鐵`
- **AND** the seal fill color SHALL resolve to the `--seal` value

#### Scenario: QR code resolves to the comment page for this pick
- **WHEN** the QR code in the generated PNG is scanned
- **THEN** it SHALL decode to an absolute HTTPS URL of the form `{origin}/comment?token={token}`
- **AND** that URL SHALL load the comment submission page for this pick
