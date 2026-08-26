/** Min time the branded boot screen stays up (matches LoadingScreen bar fill). */
export const MIN_BOOT_MS = 2400;

/** Show loading until persistence, fonts, and the splash have had time. */
export function shouldShowBoot(
  hydrated: boolean,
  splashElapsed: boolean,
  fontsReady = true,
): boolean {
  return !hydrated || !splashElapsed || !fontsReady;
}
