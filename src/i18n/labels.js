import { useI18n } from './index'

// Translated names for the schema's enum values (zones, deliveries, signals).
export function useLabels() {
  const { t } = useI18n()

  return {
    zone:      zone => t(`zone.plain.${zone}`),
    zonePhrase: zone => t(`zone.phrase.${zone}`),
    delivery:  type => t(`delivery.label.${type}`),
    signal(gesture, side) {
      if (gesture === 'no_signal') return t('signal.none')
      if (gesture === 'one_arm_up') {
        return side ? t(`signal.oneArmUp.${side}`) : t('signal.oneArmUp.unknown')
      }
      const base = t(`gesture.${gesture}`)
      return side ? t('signal.withSide', { gesture: base, side: t(`side.adverb.${side}`) }) : base
    },
  }
}
