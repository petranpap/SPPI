import { useState } from 'react'

// ── Layout: goal at BOTTOM, corner taker at BOTTOM corners ────────────────
// SVG canvas 520 × 370
// Corner flags at bottom-left / bottom-right (goal line + touchline junction)

const W = 520
const H = 370

const BOX       = { x1: 120, y1: 140, x2: 400, y2: 340 }
const GOAL_AREA = { x1: 212, y1: 340, x2: 308, y2: 370 }
const GOAL_MOUTH= { x1: 222, y1: 370, x2: 298, y2: 382 }

const ZONE_POS = {
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

const ZONE_LABEL = {
  near_post:    'NP',
  far_post:     'FP',
  penalty_spot: 'PS',
  center:       'CTR',
  outside_area: 'OUT',
}

const ZONE_RECT = {
  near_post:    { x: BOX.x1,       y: 230, w: 100,                h: 110 },
  far_post:     { x: BOX.x2 - 100, y: 230, w: 100,                h: 110 },
  penalty_spot: { x: 205,          y: 250, w: 110,                h:  90 },
  center:       { x: BOX.x1 + 30,  y: 140, w: BOX.x2-BOX.x1-60,  h: 100 },
  outside_area: { x: BOX.x1,       y:  10, w: BOX.x2 - BOX.x1,   h: 130 },
}

// Corner flag anchor points — bottom of pitch (goal line + touchline junction)
const CORNERS = {
  left:  { x: 10,      y: H - 10 },
  right: { x: W - 10,  y: H - 10 },
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
  const [hoveredZone, setHoveredZone] = useState(null)

  const activeZones = new Set()
  events.forEach(ev => {
    if (ev.zone_before) activeZones.add(ev.zone_before)
    if (ev.zone_after)  activeZones.add(ev.zone_after)
  })
  if (execution.target_zone) activeZones.add(execution.target_zone)

  const cornerSide   = execution.corner_side ?? 'right'
  const activeCorner = CORNERS[cornerSide]
  const targetPos    = ZONE_POS[execution.target_zone]

  const handleZoneClick   = (zone) => onExecChange({ ...execution, target_zone: zone })
  const handleCornerClick = (side) => onExecChange({ ...execution, corner_side: side })

  // Delivery arc from active corner (bottom) to target zone (upward into box)
  const deliveryPath = (() => {
    if (!targetPos) return null
    const fx = activeCorner.x
    const fy = activeCorner.y - 10         // start just above the corner flag
    const dx = targetPos.x - fx
    const dy = targetPos.y - fy
    const len = Math.sqrt(dx * dx + dy * dy)
    const ex = targetPos.x - (dx / len) * 22
    const ey = targetPos.y - (dy / len) * 22
    // curve inward: left corner curves right, right corner curves left
    const sign = cornerSide === 'left' ? 1 : -1
    const mx = (fx + targetPos.x) / 2 + sign * (dy / len) * 40
    const my = (fy + targetPos.y) / 2 - sign * (dx / len) * 40
    return `M${fx},${fy} Q${mx},${my} ${ex},${ey}`
  })()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Title */}
      <p className="pitch-title">
        Live Pitch · click corner flag to set side · click zone to set target
      </p>

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
          {Object.entries(ZONE_RECT).map(([zone, r]) => (
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
            x={BOX.x1} y={BOX.y1}
            width={BOX.x2 - BOX.x1} height={BOX.y2 - BOX.y1}
            fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"
          />

          {/* ── Goal area ── */}
          <rect
            x={GOAL_AREA.x1} y={GOAL_AREA.y1}
            width={GOAL_AREA.x2 - GOAL_AREA.x1} height={GOAL_AREA.y2 - GOAL_AREA.y1}
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"
          />

          {/* ── Goal mouth (extends below canvas edge, naturally clipped) ── */}
          <rect
            x={GOAL_MOUTH.x1} y={GOAL_MOUTH.y1}
            width={GOAL_MOUTH.x2 - GOAL_MOUTH.x1} height={GOAL_MOUTH.y2 - GOAL_MOUTH.y1}
            fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"
          />
          <text
            x={W / 2} y={H - 4}
            textAnchor="middle" fontSize="8"
            fill="rgba(255,255,255,0.35)" fontWeight="700" letterSpacing="2"
          >
            GOAL
          </text>

          {/* ── Penalty spot ── */}
          <circle
            cx={ZONE_POS.penalty_spot.x} cy={ZONE_POS.penalty_spot.y}
            r={3.5} fill="rgba(255,255,255,0.5)"
          />

          {/* ── Penalty arc (bows upward — away from goal at bottom) ── */}
          <path
            d={`M 205 ${ZONE_POS.penalty_spot.y} A 65 65 0 0 0 315 ${ZONE_POS.penalty_spot.y}`}
            fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2"
          />

          {/* ── Top-of-box dashed line (edge furthest from goal) ── */}
          <line
            x1={BOX.x1} y1={BOX.y1} x2={BOX.x2} y2={BOX.y1}
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
              ? ZONE_POS[ev.zone_before]
              : ZONE_POS[events[i - 1].zone_after]
            const to    = ZONE_POS[ev.zone_after]
            const color = ev.team === 'attacking' ? '#60a5fa' : '#f87171'
            return (
              <CurvedArrow key={i} from={from} to={to} color={color} label={i + 1} />
            )
          })}

          {/* ── Zone dots (visual) ── */}
          {Object.entries(ZONE_POS).map(([zone, pos]) => {
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
                  {ZONE_LABEL[zone]}
                </text>
              </g>
            )
          })}

          {/* ── Zone name labels ── */}
          {Object.entries(ZONE_POS).map(([zone, pos]) => (
            <text
              key={`lbl-${zone}`}
              x={pos.x} y={pos.y + 30}
              textAnchor="middle" fontSize="8"
              fill="rgba(255,255,255,0.2)" fontWeight="500"
              style={{ pointerEvents: 'none' }}
            >
              {zone.replace(/_/g, ' ')}
            </text>
          ))}

          {/* ── Clickable zone overlays (transparent, large touch targets) ── */}
          {Object.entries(ZONE_RECT).map(([zone, r]) => (
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

          {/* ── Corner flags (left & right, BOTTOM of pitch — goal line + touchline) ── */}
          {(['left', 'right']).map(side => {
            const c   = CORNERS[side]
            const sel = cornerSide === side
            const flagColor = sel ? '#f5c518' : 'rgba(255,255,255,0.3)'
            const poleColor = sel ? '#a8720a' : 'rgba(255,255,255,0.2)'
            // flag triangle at top of pole, points inward toward center of pitch
            const pts = side === 'left'
              ? `${c.x},${c.y-26} ${c.x+18},${c.y-17} ${c.x},${c.y-8}`
              : `${c.x},${c.y-26} ${c.x-18},${c.y-17} ${c.x},${c.y-8}`

            return (
              <g
                key={side}
                style={{ cursor: 'pointer' }}
                onClick={() => handleCornerClick(side)}
              >
                {/* Invisible large click target */}
                <circle cx={c.x} cy={c.y-14} r={26} fill="transparent" />

                {/* Selection glow ring */}
                {sel && (
                  <circle
                    cx={c.x} cy={c.y-14} r={20}
                    fill="rgba(245,197,24,0.1)"
                    stroke="#f5c518" strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                )}

                {/* Pole (goes UP from ground level) */}
                <line
                  x1={c.x} y1={c.y}
                  x2={c.x} y2={c.y-26}
                  stroke={poleColor} strokeWidth={2} strokeLinecap="round"
                />

                {/* Flag triangle (at top of pole) */}
                <polygon points={pts} fill={flagColor} opacity={sel ? 1 : 0.45} />

                {/* Corner circle (base, at ground level) */}
                <circle
                  cx={c.x} cy={c.y} r={5}
                  fill={flagColor}
                  stroke={sel ? '#a8720a' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={1.5}
                  opacity={sel ? 1 : 0.5}
                />

                {/* Side label (above the flag) */}
                <text
                  x={c.x}
                  y={c.y - 44}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={sel ? '800' : '500'}
                  fill={sel ? '#f5c518' : 'rgba(255,255,255,0.22)'}
                  letterSpacing="0.5"
                  style={{ pointerEvents: 'none' }}
                >
                  {side === 'left' ? '← L' : 'R →'}
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
          <span>Active corner</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#22c55e', borderRadius: '2px', width: '16px', height: '4px' }} />
          <span>Delivery</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#60a5fa' }} />
          <span>Attacking</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f87171' }} />
          <span>Defending</span>
        </div>
        {Object.entries(ZONE_COLOR).map(([zone, color]) => (
          <div key={zone} className="legend-item">
            <div className="legend-dot" style={{ background: color }} />
            <span>{zone.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
