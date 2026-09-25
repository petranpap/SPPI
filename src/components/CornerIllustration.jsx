// Decorative diagram of one corner phase: delivery arc, then the numbered ball contacts.
export default function CornerIllustration() {
  return (
    <svg
      className="corner-illustration"
      viewBox="0 0 360 290"
      role="img"
      aria-label="Diagram of a corner kick: the ball is delivered into the penalty area, followed by three numbered ball contacts"
    >
      <rect x="6" y="6" width="348" height="266" rx="14" className="ci-pitch" />

      <g className="ci-lines">
        <rect x="46" y="112" width="268" height="160" />
        <rect x="122" y="212" width="116" height="60" />
        <path d="M144 112 A38 38 0 0 1 216 112" />
        <circle cx="180" cy="196" r="2.5" className="ci-spot" />
      </g>
      <rect x="150" y="272" width="60" height="12" rx="2" className="ci-goal" />

      <path className="ci-flag" d="M330 268 V240 L346 247 L330 254" />
      <path className="ci-delivery" d="M334 262 C 300 176, 236 150, 162 164" />
      <path className="ci-arrow" d="M172 153 L161 164 L174 171" />

      <g className="ci-events">
        <line x1="146" y1="168" x2="120" y2="204" />
        <line x1="120" y1="204" x2="196" y2="236" />
        <circle cx="146" cy="168" r="11" className="ci-dot ci-dot--attack" />
        <circle cx="120" cy="204" r="11" className="ci-dot ci-dot--defend" />
        <circle cx="196" cy="236" r="11" className="ci-dot ci-dot--attack" />
        <text x="146" y="172">1</text>
        <text x="120" y="208">2</text>
        <text x="196" y="240">3</text>
      </g>
    </svg>
  )
}
