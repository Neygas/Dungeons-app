export const haptic = {
  light:       () => navigator.vibrate?.(12),
  medium:      () => navigator.vibrate?.(30),
  damage:      () => navigator.vibrate?.([50, 30, 100]),
  heal:        () => navigator.vibrate?.([20, 15, 20]),
  yourTurn:    () => navigator.vibrate?.([40, 30, 80, 30, 40]),
  combatStart: () => navigator.vibrate?.([80, 50, 80, 50, 200]),
  shortRest:   () => navigator.vibrate?.([30, 20, 60]),
  longRest:    () => navigator.vibrate?.([60, 40, 120, 40, 200]),
  levelUp:     () => navigator.vibrate?.([50, 30, 50, 30, 100, 40, 180]),
  diceRoll:    () => navigator.vibrate?.(15),
  itemUse:     () => navigator.vibrate?.(30),
}
