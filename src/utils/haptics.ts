import { useSettingsStore } from '@/store/settingsStore'

function vibe(pattern: number | number[]) {
  if (useSettingsStore.getState().vibrationsEnabled) navigator.vibrate?.(pattern)
}

export const haptic = {
  light:       () => vibe(12),
  medium:      () => vibe(30),
  damage:      () => vibe([50, 30, 100]),
  heal:        () => vibe([20, 15, 20]),
  yourTurn:    () => vibe([40, 30, 80, 30, 40]),
  combatStart: () => vibe([80, 50, 80, 50, 200]),
  shortRest:   () => vibe([30, 20, 60]),
  longRest:    () => vibe([60, 40, 120, 40, 200]),
  levelUp:     () => vibe([50, 30, 50, 30, 100, 40, 180]),
  diceRoll:    () => vibe(15),
  itemUse:     () => vibe(30),
}
