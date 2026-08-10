/** Min time the branded boot screen stays up (matches LoadingScreen bar fill). */
export const MIN_BOOT_MS = 2400;

/** Show loading until persistence is ready AND the splash has had time to play. */
export function shouldShowBoot(hydrated: boolean, splashElapsed: boolean): boolean {
  return !hydrated || !splashElapsed;
}
