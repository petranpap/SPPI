import { useState } from 'react'
import { useI18n } from '../i18n'

// ── Layout: goal at BOTTOM, corner taker at BOTTOM corners (before orientation flip) ──
// SVG canvas 520 × 370
// Corner flags at bottom-left / bottom-right (goal line + touchline junction)

const W = 520
const H = 370
const ORIENTATION_KEY = 'sppi_pitch_goal_top'

const BOX       = { x1: 120, y1: 140, x2: 400, y2: 340 }
const GOAL_AREA = { x1: 212, y1: 340, x2: 308, y2: 370 }
const GOAL_MOUTH= { x1: 222, y1: 370, x2: 298, y2: 382 }

// Positions for a LEFT corner (near_post on the left, close to the corner; far_post on the
// right). "Near post" and "far post" are defined relative to the corner being taken, not to
// a fixed screen side — a right corner mirrors these two horizontally (see laterate() below),
// per the schema: "Zone boundaries are corner-side-aware."
const ZONE_POS_LEFT_CORNER = {
  near_post:    { x: 170, y: 295 },
  far_post:     { x: 350, y: 295 },
  penalty_spot: { x: 260, y: 258 },
  center:       { x: 260, y: 200 },
  outside_area: { x: 260, y:  75 },
}

const ZONE_COLOR = {
  near_post:    '#ef4444',
  far_post:     '#f97316',
  penalty_spot: '#a855f7',
  center:       '#eab308',
  outside_area: '#64748b',
}

const ZONE_RECT_LEFT_CORNER = {
  near_post:    { x: BOX.x1,       y: 230, w: 100,                h: 110 },
  far_post:     { x: BOX.x2 - 100, y: 230, w: 100,                h: 110 },
  penalty_spot: { x: 205,          y: 250, w: 110,                h:  90 },
  center:       { x: BOX.x1 + 30,  y: 140, w: BOX.x2-BOX.x1-60,  h: 100 },
  outside_area: { x: BOX.x1,       y:  10, w: BOX.x2 - BOX.x1,   h: 130 },
}

// For a right corner, near_post and far_post swap sides. The two are already laid out as
// horizontal mirror images of each other in *_LEFT_CORNER (same y/height, x spans symmetric
// around the pitch's center), so swapping the two entries outright is the correct mirror —
// every other zone is centered on the goal and untouched either way.
function laterate(positions, cornerSide) {
  if (cornerSide !== 'right') return positions
  return { ...positions, near_post: positions.far_post, far_post: positions.near_post }
}

// Corner flag anchor points — ground level, before orientation flip (bottom of pitch)
const CORNERS = {
  left:  { x: 10,      y: H - 10 },
  right: { x: W - 10,  y: H - 10 },
}

function loadOrientation() {
  try { return localStorage.getItem(ORIENTATION_KEY) === '1' } catch { return false }
}

// A rect given as {x,y,w,h} with y=top. Mirroring the pitch vertically (goal moves from
// bottom to top) needs every rect's top/bottom to swap, not just its y read through fy() —
// width/x and the rect's own height are unaffected, only where its top edge lands.
function flipRect(r, fy, flipped) {
  if (!flipped) return r
  const edgeA = fy(r.y)
  const edgeB = fy(r.y + r.h)
  return { ...r, y: Math.min(edgeA, edgeB), h: Math.abs(edgeA - edgeB) }
}

// ── Curved arrow ──────────────────────────────────────────────────────────
function CurvedArrow({ from, to, color, label }) {
  if (!from || !to) return null

  const sameZone = from.x === to.x && from.y === to.y
  if (sameZone) {
    const r = 14
    return (
      <g>
        <circle
          cx={from.x + r} cy={from.y - r} r={r}
          fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.75"
        />
        {label !== undefined && (
          <circle cx={from.x + r} cy={from.y - r} r={7} fill={color} opacity="0.85" />
        )}
        {label !== undefined && (
          <text x={from.x + r} y={from.y - r + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="700">
            {label}
          </text>
        )}
      </g>
    )
  }

  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)
  const nx = -dy / len
  const ny =  dx / len
  const curve = Math.min(len * 0.3, 30)
  const mx = (from.x + to.x) / 2 + nx * curve
  const my = (from.y + to.y) / 2 + ny * curve
  const pullFrac = 20 / len
  const sx = from.x + dx * pullFrac
  const sy = from.y + dy * pullFrac
  const ex = to.x   - dx * pullFrac
  const ey = to.y   - dy * pullFrac
  const pid = `arr-${Math.round(from.x)}-${Math.round(from.y)}-${Math.round(to.x)}-${Math.round(to.y)}`

  return (
    <g>
      <defs>
        <marker id={pid} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={color} opacity="0.8" />
        </marker>
      </defs>
      <path
        d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`}
        fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.8"
        markerEnd={`url(#${pid})`}
      />
      {label !== undefined && (
        <>
          <circle cx={mx} cy={my} r={8} fill={color} opacity="0.9" />
          <text x={mx} y={my + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="800">
            {label}
          </text>
        </>
      )}
    </g>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function PitchDiagram({ events, execution, onExecChange }) {
  const { t } = useI18n()
  const [hoveredZone, setHoveredZone] = useState(null)
  // Purely a view preference — remembered per browser, never sent to the server or stored
  // in the SPPI record. Lets the diagram match whichever way the source video is pointing.
  const [flipped, setFlipped] = useState(loadOrientation)

  const setOrientation = next => {
    setFlipped(next)
    try { localStorage.setItem(ORIENTATION_KEY, next ? '1' : '0') } catch { /* preference just won't persist */ }
  }

  // The one coordinate transform everything below is built from: mirror top<->bottom,
  // left/right untouched. Decorative "always points up on screen" elements (the flagpole)
  // use `dir` instead, since a pole shouldn't literally mirror — see the corner-flag block.
  const fy  = y => (flipped ? H - y : y)
  const dir = flipped ? -1 : 1

  const cornerSide = execution.corner_side ?? 'right'

  const zonePosLateral  = laterate(ZONE_POS_LEFT_CORNER, cornerSide)
  const zoneRectLateral = laterate(ZONE_RECT_LEFT_CORNER, cornerSide)
  const zonePos = Object.fromEntries(Object.entries(zonePosLateral).map(([zone, p]) => [zone, { x: p.x, y: fy(p.y) }]))
  const corners = Object.fromEntries(Object.entries(CORNERS).map(([side, p]) => [side, { x: p.x, y: fy(p.y) }]))
  const box       = flipRect({ x: BOX.x1,       y: BOX.y1,       w: BOX.x2 - BOX.x1,             h: BOX.y2 - BOX.y1       }, fy, flipped)
  const goalArea  = flipRect({ x: GOAL_AREA.x1,  y: GOAL_AREA.y1,  w: GOAL_AREA.x2 - GOAL_AREA.x1,  h: GOAL_AREA.y2 - GOAL_AREA.y1 }, fy, flipped)
  const goalMouth = flipRect({ x: GOAL_MOUTH.x1, y: GOAL_MOUTH.y1, w: GOAL_MOUTH.x2 - GOAL_MOUTH.x1, h: GOAL_MOUTH.y2 - GOAL_MOUTH.y1 }, fy, flipped)
  const zoneRects = Object.fromEntries(Object.entries(zoneRectLateral).map(([zone, r]) => [zone, flipRect(r, fy, flipped)]))

  const activeZones = new Set()
  events.forEach(ev => {
    if (ev.zone_before) activeZones.add(ev.zone_before)
    if (ev.zone_after)  activeZones.add(ev.zone_after)
  })
  if (execution.target_zone) activeZones.add(execution.target_zone)
  const activeCorner = corners[cornerSide]
  const targetPos    = zonePos[execution.target_zone]

  const handleZoneClick   = (zone) => onExecChange({ ...execution, target_zone: zone })
  const handleCornerClick = (side) => onExecChange({ ...execution, corner_side: side })

  // Delivery arc from the active corner into the target zone. Pure vector math on already
  // flip-aware points (activeCorner/targetPos), so it needs no separate orientation case —
  // only the left/right inward-curve sign below is about corner_side, not up/down.
  const deliveryPath = (() => {
    if (!targetPos) return null
    const startX = activeCorner.x
    const startY = activeCorner.y - 10 * dir   // just off the corner flag, into the pitch
    const dx = targetPos.x - startX
    const dy = targetPos.y - startY
    const len = Math.sqrt(dx * dx + dy * dy)
    const endX = targetPos.x - (dx / len) * 22
    const endY = targetPos.y - (dy / len) * 22
    const sign = cornerSide === 'left' ? 1 : -1
    const mx = (startX + targetPos.x) / 2 + sign * (dy / len) * 40
    const my = (startY + targetPos.y) / 2 - sign * (dx / len) * 40
    return `M${startX},${startY} Q${mx},${my} ${endX},${endY}`
  })()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Title + orientation control */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p className="pitch-title" style={{ marginBottom: 0 }}>
          {t('pitch.title')}
        </p>
        <div className="orientation-switch" title={t('pitch.orientationHint')}>
          <span className="orientation-label">{t('pitch.orientationLabel')}</span>
          <button
            type="button"
            className={`orientation-btn ${!flipped ? 'orientation-btn--active' : ''}`}
            aria-pressed={!flipped}
            onClick={() => setOrientation(false)}
          >
            {t('pitch.goalBottom')}
          </button>
          <button
            type="button"
            className={`orientation-btn ${flipped ? 'orientation-btn--active' : ''}`}
            aria-pressed={flipped}
            onClick={() => setOrientation(true)}
          >
            {t('pitch.goalTop')}
          </button>
        </div>
      </div>

      {/* SVG wrapper — fills available space */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          style={{ display: 'block', borderRadius: '8px' }}
        >
          {/* ── Defs ── */}
          <defs>
            <pattern id="stripes" patternUnits="userSpaceOnUse" width="30" height="30">
              <rect width="30" height="30" fill="#1e5c28" />
              <rect width="15" height="30" fill="#236930" />
            </pattern>
            <marker id="del-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L7,3.5 z" fill="#22c55e" opacity="0.9" />
            </marker>
          </defs>

          {/* ── Pitch background ── */}
          <rect width={W} height={H} fill="url(#stripes)" rx="6" />

          {/* ── Zone shading (hover + active) ── */}
          {Object.entries(zoneRects).map(([zone, r]) => (
            <rect
              key={`shade-${zone}`}
              x={r.x} y={r.y} width={r.w} height={r.h}
              fill={ZONE_COLOR[zone]}
              opacity={hoveredZone === zone ? 0.25 : activeZones.has(zone) ? 0.12 : 0}
              style={{ transition: 'opacity 0.12s', pointerEvents: 'none' }}
            />
          ))}

          {/* ── Penalty area ── */}
          <rect
            x={box.x} y={box.y}
            width={box.w} height={box.h}
            fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"
          />

          {/* ── Goal area ── */}
          <rect
            x={goalArea.x} y={goalArea.y}
            width={goalArea.w} height={goalArea.h}
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"
          />

          {/* ── Goal mouth (extends past the canvas edge, naturally clipped) ── */}
          <rect
            x={goalMouth.x} y={goalMouth.y}
            width={goalMouth.w} height={goalMouth.h}
            fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"
          />
          <text
            x={W / 2} y={flipped ? 14 : H - 4}
            textAnchor="middle" fontSize="8"
            fill="rgba(255,255,255,0.35)" fontWeight="700" letterSpacing="2"
          >
            {t('pitch.goal')}
          </text>

          {/* ── Penalty spot ── */}
          <circle
            cx={zonePos.penalty_spot.x} cy={zonePos.penalty_spot.y}
            r={3.5} fill="rgba(255,255,255,0.5)"
          />

          {/* ── Penalty arc (always bows away from goal; the sweep flag flips with orientation) ── */}
          <path
            d={`M 205 ${zonePos.penalty_spot.y} A 65 65 0 0 ${flipped ? 1 : 0} 315 ${zonePos.penalty_spot.y}`}
            fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2"
          />

          {/* ── Top-of-box dashed line (edge furthest from goal) ── */}
          <line
            x1={box.x} y1={box.y} x2={box.x + box.w} y2={box.y}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="5,4"
          />

          {/* ── Delivery arc ── */}
          {deliveryPath && (
            <path
              d={deliveryPath}
              fill="none" stroke="#22c55e" strokeWidth="2"
              strokeDasharray="6,4" strokeOpacity="0.75"
              markerEnd="url(#del-arrow)"
            />
          )}

          {/* ── Target zone ring ── */}
          {targetPos && (
            <circle
              cx={targetPos.x} cy={targetPos.y} r={24}
              fill="none" stroke="#22c55e" strokeWidth="1.5"
              strokeDasharray="4,3" opacity="0.7"
            />
          )}

          {/* ── Event movement arrows (chained: arrow i starts where arrow i-1 ended) ── */}
          {events.map((ev, i) => {
            const from = i === 0
              ? zonePos[ev.zone_before]
              : zonePos[events[i - 1].zone_after]
            const to    = zonePos[ev.zone_after]
            const color = ev.team === 'attacking' ? '#60a5fa' : '#f87171'
            return (
              <CurvedArrow key={i} from={from} to={to} color={color} label={i + 1} />
            )
          })}

          {/* ── Zone dots (visual) ── */}
          {Object.entries(zonePos).map(([zone, pos]) => {
            const active   = activeZones.has(zone)
            const isTarget = execution.target_zone === zone
            return (
              <g key={zone} style={{ pointerEvents: 'none' }}>
                <circle
                  cx={pos.x} cy={pos.y} r={16}
                  fill={active ? ZONE_COLOR[zone] : 'rgba(255,255,255,0.05)'}
                  stroke={ZONE_COLOR[zone]}
                  strokeWidth={active || isTarget ? 2 : 1}
                  strokeOpacity={active ? 0.9 : 0.35}
                />
                <text
                  x={pos.x} y={pos.y + 4}
                  textAnchor="middle" fontSize="9"
                  fill={active ? 'white' : 'rgba(255,255,255,0.4)'}
                  fontWeight="700" fontFamily="monospace"
                >
                  {t(`zone.abbr.${zone}`)}
                </text>
              </g>
            )
          })}

          {/* ── Zone name labels ── */}
          {Object.entries(zonePos).map(([zone, pos]) => (
            <text
              key={`lbl-${zone}`}
              x={pos.x} y={pos.y + 30}
              textAnchor="middle" fontSize="8"
              fill="rgba(255,255,255,0.2)" fontWeight="500"
              style={{ pointerEvents: 'none' }}
            >
              {t(`zone.plain.${zone}`).toLowerCase()}
            </text>
          ))}

          {/* ── Clickable zone overlays (transparent, large touch targets) ── */}
          {Object.entries(zoneRects).map(([zone, r]) => (
            <rect
              key={`tap-${zone}`}
              x={r.x} y={r.y} width={r.w} height={r.h}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => handleZoneClick(zone)}
              onMouseEnter={() => setHoveredZone(zone)}
              onMouseLeave={() => setHoveredZone(null)}
            />
          ))}

          {/* ── Corner flags (left & right, at ground level — bottom of pitch, or top when flipped) ── */}
          {(['left', 'right']).map(side => {
            const c   = corners[side]
            const sel = cornerSide === side
            const flagColor = sel ? '#f5c518' : 'rgba(255,255,255,0.3)'
            const poleColor = sel ? '#a8720a' : 'rgba(255,255,255,0.2)'
            // The pole always points "up" on screen in the unflipped view; dir mirrors that
            // when the anchor itself has moved to the top edge, so it still points into the pitch.
            const poleTipY = c.y - 26 * dir
            // flag triangle at the tip of the pole, points inward toward the center of the pitch
            const pts = side === 'left'
              ? `${c.x},${poleTipY} ${c.x+18},${c.y-17*dir} ${c.x},${c.y-8*dir}`
              : `${c.x},${poleTipY} ${c.x-18},${c.y-17*dir} ${c.x},${c.y-8*dir}`

            return (
              <g
                key={side}
                style={{ cursor: 'pointer' }}
                onClick={() => handleCornerClick(side)}
              >
                {/* Invisible large click target */}
                <circle cx={c.x} cy={c.y - 14 * dir} r={26} fill="transparent" />

                {/* Selection glow ring */}
                {sel && (
                  <circle
                    cx={c.x} cy={c.y - 14 * dir} r={20}
                    fill="rgba(245,197,24,0.1)"
                    stroke="#f5c518" strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                )}

                {/* Pole (goes from ground level toward the inside of the pitch) */}
                <line
                  x1={c.x} y1={c.y}
                  x2={c.x} y2={poleTipY}
                  stroke={poleColor} strokeWidth={2} strokeLinecap="round"
                />

                {/* Flag triangle (at the tip of the pole) */}
                <polygon points={pts} fill={flagColor} opacity={sel ? 1 : 0.45} />

                {/* Corner circle (base, at ground level) */}
                <circle
                  cx={c.x} cy={c.y} r={5}
                  fill={flagColor}
                  stroke={sel ? '#a8720a' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={1.5}
                  opacity={sel ? 1 : 0.5}
                />

                {/* Side label (beyond the flag tip, away from the pitch) */}
                <text
                  x={c.x}
                  y={c.y - 44 * dir}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={sel ? '800' : '500'}
                  fill={sel ? '#f5c518' : 'rgba(255,255,255,0.22)'}
                  letterSpacing="0.5"
                  style={{ pointerEvents: 'none' }}
                >
                  {side === 'left' ? t('pitch.sideLeft') : t('pitch.sideRight')}
                </text>
              </g>
            )
          })}

        </svg>
      </div>

      {/* ── Legend ── */}
      <div className="pitch-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f5c518', borderRadius: '2px' }} />
          <span>{t('pitch.activeCorner')}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#22c55e', borderRadius: '2px', width: '16px', height: '4px' }} />
          <span>{t('pitch.delivery')}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#60a5fa' }} />
          <span>{t('pitch.attacking')}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f87171' }} />
          <span>{t('pitch.defending')}</span>
        </div>
        {Object.entries(ZONE_COLOR).map(([zone, color]) => (
          <div key={zone} className="legend-item">
            <div className="legend-dot" style={{ background: color }} />
            <span>{t(`zone.plain.${zone}`).toLowerCase()}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
