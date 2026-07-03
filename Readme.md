# SPPI — Set-Piece Phase Instance

**A formal, provider-independent data model for representing football corner kick attacking phases.**

Part of the PhD dissertation *"A Unified Framework for Football Set-Piece Analysis"* at the Cyprus University of Technology (CUT), Department of Electrical Engineering, Computer Engineering & Informatics.

---

## What is SPPI?

SPPI (Set-Piece Phase Instance) is a JSON schema and manual-entry tool for encoding corner kick phases from football (soccer) matches. It is designed to be:

- **Provider-independent**: works across StatsBomb, Wyscout, and Opta data formats
- **Formally grounded**: phase boundaries are defined as geometric predicates over observable game states
- **Analyst-accessible**: the web tool requires no technical knowledge — analysts fill in a form, the schema is generated silently

Each SPPI instance encodes a single corner kick attacking phase as a structured JSON object with five blocks: `metadata`, `context`, `execution`, `events`, and `outcome`.

---

## Repository Contents

```
SPPI/
├── src/                    # React source (Vite + React 18)
│   ├── App.jsx             # Main app, JSON builder, validation
│   ├── components/
│   │   ├── MetadataSection.jsx
│   │   ├── ContextSection.jsx
│   │   ├── ExecutionSection.jsx   # Signal sub-object, dual executor
│   │   ├── EventsSection.jsx      # Ball-contact event sequence
│   │   ├── OutcomeSection.jsx     # Termination + linked instances
│   │   ├── PitchDiagram.jsx       # Interactive SVG pitch visualization
│   │   └── ZoneSelector.jsx       # Five-zone selector component
│   └── index.css
├── dist/                   # Production build
├── examples/               # Demo SPPI JSON instances
│   └── demo_SPPI_001.json
├── schema/
│   └── sppi_v1_schema.json # JSON Schema (draft-07) for validation
├── index.html
├── package.json
└── vite.config.js
```

---

## Quick Start

```bash
npm install
npm run dev       # Development server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

**Requirements:** Node.js ≥ 18, npm ≥ 9

---

## SPPI Schema (v1.0)

### Five-Block Structure

```json
{
  "metadata":  { ... },   // Match provenance, source, IDs
  "context":   { ... },   // Match state at phase initiation
  "execution": { ... },   // Delivery parameters + optional signal
  "events":    [ ... ],   // Ordered ball-contact sequence
  "outcome":   { ... }    // Phase termination + linked instances
}
```

### Phase Boundary Conditions

A corner kick phase is **initiated** when the executor makes first contact with the ball at the corner arc.

A phase **terminates** at the first satisfied condition:
- **T₁** `goal_scored` — ball crosses the goal line between the posts
- **T₂** `ball_exits_field ∧ ¬T₁` — ball exits the field of play (non-goal)
- **T₃** `ball_exits_penalty_area_outward ∧ ¬atk_recovers` — ball cleared from the penalty area without immediate attacking recovery

### Zone Taxonomy

Five zones with priority-based assignment (near_post ≻ far_post ≻ center ≻ penalty_spot ≻ outside_area):

| Zone | Description |
|---|---|
| `near_post` | Area closest to the active corner arc |
| `far_post` | Area on the opposite side from the corner |
| `center` | Central penalty area |
| `penalty_spot` | Around the penalty spot / D |
| `outside_area` | All positions outside the penalty area |

Zone boundaries are **corner-side-aware**: `near_post` and `far_post` flip horizontally depending on `execution.corner_side`.

### Novel Feature: Pre-Execution Signal

SPPI captures pre-execution signalling behaviour absent from all commercial schemas:

```json
"signal": {
  "signaler": { "jersey_number": 9, "location": "near_post" },
  "gesture": "one_arm_up",
  "target": "near_post"
}
```

The `signaler` may differ from the executor — capturing cases where a player inside the penalty area directs the corner.

### Linked Instance Architecture

Derived phases (e.g., short corners) are represented as separate SPPI instances linked by reference:

```json
// Parent (original corner)
"outcome": { "spawned_instance": "SPPI_002", ... }

// Child (short corner follow-up)
"outcome": { "parent_instance": "SPPI_001", ... }
```

---

## Demo Instance

See [`examples/demo_SPPI_001.json`](examples/demo_SPPI_001.json) for a complete worked example:
a Barcelona corner at 67', signalled by player #9 at the near post, resulting in a header → clearance → shot → out of play (T₂).

---

## Validation

The JSON Schema at [`schema/sppi_v1_schema.json`](schema/sppi_v1_schema.json) can be used to validate instances:

```bash
npm install -g ajv-cli
ajv validate -s schema/sppi_v1_schema.json -d examples/demo_SPPI_001.json
```

Key validation rules:
- V1: `sppi_id` must be unique within a collection
- V2: `events` array must be non-empty (enforces `a < b` in the formal model)
- V3: `sequence_index` must be strictly monotonically increasing from 1
- V4: At least one executor with `role: "primary"` required

---

## Schema Version History

| Version | Date | Notes |
|---|---|---|
| v1.0 | 2025 | Initial specification. Corner kicks. Manual entry only. |

---

## Planned Work (Phase 1)

- [ ] StatsBomb open-data converter (Python)
- [ ] `ball_zone_after` field in events block (ball position, separate from player position)
- [ ] Multi-annotator inter-agreement validation (Cohen's κ on phase segmentation and zone assignment)
- [ ] `.gitignore` to exclude `node_modules` and `dist`

---

## Citation

If you use SPPI in your research, please cite:

```
Papagiannis, P. (2025). A Unified Framework for Football Set-Piece Analysis.
Comprehensive Examination Report, Cyprus University of Technology.
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

Petros Papagiannis — PhD Candidate, Cyprus University of Technology  
[peterpapagiannis@yahoo.com](mailto:peterpapagiannis@yahoo.com) · [GitHub @petranpap](https://github.com/petranpap)