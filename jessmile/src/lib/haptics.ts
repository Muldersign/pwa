/** Subtle haptic tick where supported (Android/Chrome). iOS Safari ignores it silently. */
export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
