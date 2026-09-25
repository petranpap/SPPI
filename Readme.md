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
├── server/                 # Express + Knex API (auth, persistence, insights)
│   ├── repositories/       # ALL database access; annotation queries are user-scoped
│   ├── routes/             # auth, annotations, insights
│   ├── migrations/         # reversible Knex migrations
│   ├── scripts/create-user.js
│   └── test/               # isolation + insights tests (node:test)
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

**Requirements:** Node.js ≥ 20 (tested on 20.20 and 24), npm ≥ 9. `better-sqlite3` is pinned to 12.9.0, the newest release that ships a prebuilt binary for Node 20; newer releases need Node 22+ and crash on Node 20.

### Running with the backend

```bash
cp .env.example .env                       # set JWT_SECRET
npm run dev:server                         # API on http://localhost:3001 (creates data/sppi.sqlite)
npm run dev                                # UI on http://localhost:5173, proxies /api to the API
npm test                                   # backend tests
```

Production: `npm run build && NODE_ENV=production npm start` — Express serves `dist/` and the API on one port.
Users sign up themselves on the login screen (username, name, password ≥ 10 characters) and are signed in immediately.
Admin tools: `npm run create-user -- --username maria --name "Maria K."` creates an account, and `--reset` sets a new password.

---

## Pages

| Path | Access | What |
|---|---|---|
| `/` | public | Welcome page: what SPPI is and what the tool does |
| `/login` | public | Sign in; `/login?mode=register` opens sign-up |
| `/help` | public | How to use the recorder, plus FAQ |
| `/app` | signed in | The recorder and Insights (signed-out visitors are sent to `/login`) |

Client-side routing (React Router): in production Express serves `index.html` for these paths, so they work when opened directly or refreshed. Behind Apache/Nginx, proxy everything to the Node process (no `try_files` rules needed).

---

## Languages (English / Ελληνικά)

The whole UI — public pages, the recorder, Insights, error messages — is available in English and Greek. A small **EN | ΕΛ** switch sits in the header (also inside the app after login). The choice is remembered in the browser; first-time visitors get Greek if their browser language is Greek, otherwise English. Switching mid-form does not lose anything you typed.

- Text lives in `src/i18n/en.js` (source of truth) and `src/i18n/el.js`. Use `const { t } = useI18n()` and `t('section.key', { vars })`; `**bold**` and `[link](/path)` in a string are rendered by `<RichText>`.
- Only labels are translated. Values stored and sent to the server (`near_post`, `inswinger`, …) and the SPPI JSON schema stay in English.
- The server sends a stable `code` with every error (`invalid_credentials`, `duplicate_sppi_id`, …); the client shows it in the user's language and falls back to the server's English text.
- `npm test` fails if the Greek dictionary is missing a key, has different `{placeholders}`, or if the server can send an error code that has no message in both languages. To add a language, add `src/i18n/<code>.js`, register it in `src/i18n/index.jsx`, and the same test checks it.
- Greek needs a font with Greek glyphs: the page font stack falls back to Inter (Space Grotesk has none).

---

## Accounts, data isolation & Insights

- **Self-registration, gated by a shared invite code.** Set `REGISTRATION_CODE` in `.env` and share it with your coaches; sign-up also asks for it. Leave it unset only for local testing — the server logs a warning in production if it's missing, because that means anyone who finds the URL can create an account. Also rate-limited: 10 sign-ups per IP per hour, 10 failed logins per IP+username per 15 minutes. Behind a reverse proxy set `TRUST_PROXY=1` so limits see real client IPs, not the proxy's.
- **Every annotation belongs to the user who saved it, and only that user can read it.** The user id comes from the signed session cookie, never from the request. All annotation queries live in `server/repositories/annotationRepository.js` and require a user id. There is **no endpoint that queries by team, coach or user across accounts** — this is deliberate scope control, not an omission. Two managers annotating "Real Madrid" each see only their own corners.
- **Insights** (Record ⇄ Insights tab): group your own annotations by attacking team or by attacking coach. Once a group has ≥ 10 of your annotations you get descriptive counts (signal → delivery target, delivery type, target zone). Below 10, the server returns no breakdown at all. These are frequency counts of what you recorded — not predictions.
- Storage is SQLite by default. Set `DATABASE_URL` (and `npm i pg`) to run on Postgres; the schema is managed by Knex migrations.
- StatsBomb timestamps, where used for video navigation elsewhere, never pre-fill or influence annotation fields.

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
| v1.0+ | 2026 | Additive, optional: `metadata.attacking_coach`, `execution.signal.gesture_side`. |

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