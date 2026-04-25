## MODIFIED Requirements

### Requirement: Signature visual elements
The public surface SHALL express three signature elements: (1) a **rail-tick rule** — a horizontal/vertical 1px `--rule` line decorated with repeating short tick marks, used as a divider between top bar and content, between picker panes, and between result-card regions; (2) a **kerf edge** — a dashed top/bottom edge on the omikuji card evoking a torn ticket; (3) a **two-color offset shadow** — a dual-tone micro shadow on cards evoking risograph misregistration. These elements SHALL be implemented as reusable React components or CSS utility classes so consuming pages do not reimplement them.

The legacy fourth element — a circular `<SealMark>` stamp carrying pick date and 籤號 — is retired. Result cards SHALL NOT render `<SealMark>` as a brand primitive; the shareable-ticket PNG inlines its own stamp geometry for the `此站有緣` red rectangular stamp, and no other surface requires a seal element.

#### Scenario: Rail-tick rule available as a reusable primitive
- **WHEN** a page needs a divider
- **THEN** it SHALL use `<RailTickRule>` (or a shared class such as `.rail-tick-rule`)
- **AND** no page SHALL hard-code the tick geometry inline

#### Scenario: Kerf edge on omikuji card
- **WHEN** the outer omikuji card renders on the home page
- **THEN** its top and bottom edges SHALL show a dashed kerf (CSS `border-style: dashed` or SVG equivalent at 4px dash / 2px gap)

#### Scenario: No SealMark component in the public component tree
- **WHEN** the public component tree (`app/(public)/**`, `components/mrt/**`, `components/tra/**`, `components/omikuji/**`) is scanned
- **THEN** no element SHALL render `<SealMark>`
- **AND** the `components/omikuji/SealMark.tsx` file SHALL NOT exist
