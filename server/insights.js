// Descriptive frequency counts over ONE user's own annotations for ONE group.
// Plain tallies only — no scoring, no prediction.

export const INSIGHTS_THRESHOLD = 10

const TARGET_ZONES   = ['near_post', 'far_post', 'center', 'penalty_spot', 'outside_area']
const DELIVERY_TYPES = ['inswinger', 'outswinger', 'flat', 'short']
const NO_SIGNAL      = 'no_signal'

function tally(values, categories) {
  const counts = Object.fromEntries(categories.map(category => [category, 0]))
  for (const value of values) {
    if (value in counts) counts[value] += 1
  }
  return categories.map(category => ({ key: category, count: counts[category] }))
}

function describeSignal(signal) {
  if (!signal || signal.gesture === 'none') return { gesture: NO_SIGNAL, side: null }
  return { gesture: signal.gesture, side: signal.gesture_side ?? null }
}

function tallySignalToDelivery(payloads) {
  const counts = new Map()
  for (const payload of payloads) {
    const { gesture, side } = describeSignal(payload.execution.signal)
    const targetZone = payload.execution.target_zone
    const comboKey = JSON.stringify([gesture, side, targetZone])
    counts.set(comboKey, (counts.get(comboKey) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([comboKey, count]) => {
      const [gesture, side, targetZone] = JSON.parse(comboKey)
      return { gesture, side, target_zone: targetZone, count }
    })
    .sort((a, b) => b.count - a.count)
}

export function buildInsights(payloads) {
  const total = payloads.length
  const unlocked = total >= INSIGHTS_THRESHOLD
  const summary = {
    total,
    threshold: INSIGHTS_THRESHOLD,
    unlocked,
    remaining: Math.max(0, INSIGHTS_THRESHOLD - total),
  }
  // Below the threshold no breakdown leaves the server, so the gate is not just cosmetic.
  if (!unlocked) return summary

  return {
    ...summary,
    targetZone:       tally(payloads.map(p => p.execution.target_zone), TARGET_ZONES),
    deliveryType:     tally(payloads.map(p => p.execution.delivery_type), DELIVERY_TYPES),
    signalToDelivery: tallySignalToDelivery(payloads),
  }
}
