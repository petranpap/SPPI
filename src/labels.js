export const ZONE_LABELS = {
  near_post:    'Near post',
  far_post:     'Far post',
  center:       'Center',
  penalty_spot: 'Penalty spot',
  outside_area: 'Outside area',
}

const ZONE_PHRASES = {
  near_post:    'went to the near post',
  far_post:     'went to the far post',
  center:       'went to the center',
  penalty_spot: 'went to the penalty spot',
  outside_area: 'went outside the penalty area',
}

export const DELIVERY_LABELS = {
  inswinger:  'Inswinger',
  outswinger: 'Outswinger',
  flat:       'Flat',
  short:      'Short',
}

const GESTURE_LABELS = {
  one_arm_up:  'One arm up',
  two_arms_up: 'Two arms up',
  point_near:  'Point near',
  point_far:   'Point far',
  wave:        'Wave',
  open_hand:   'Open hand',
}

export function zonePhrase(zone) {
  return ZONE_PHRASES[zone]
}

export function signalLabel(gesture, side) {
  if (gesture === 'no_signal') return 'No signal'
  if (gesture === 'one_arm_up') {
    return side ? `${side === 'left' ? 'Left' : 'Right'} arm up` : 'One arm up (side not recorded)'
  }
  const base = GESTURE_LABELS[gesture] ?? gesture
  return side ? `${base} (${side})` : base
}
