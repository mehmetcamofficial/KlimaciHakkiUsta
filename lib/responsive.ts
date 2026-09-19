export type ScreenSize = "mobile" | "tablet" | "desktop";

/**
 * Single source of truth for the app's responsive breakpoints. Kept as a
 * pure width->size classifier (no React/RN import) so it's unit-testable
 * without a renderer — hooks/use-screen-size.ts is the only thing that
 * wraps this with useWindowDimensions().
 */
export const breakpoints = {
  tablet: 768,
  desktop: 1024,
};

export function getScreenSize(width: number): ScreenSize {
  if (width >= breakpoints.desktop) return "desktop";
  if (width >= breakpoints.tablet) return "tablet";
  return "mobile";
}

/**
 * Max content widths for Screen's `width` variant. A single capped value
 * (rather than separate per-breakpoint numbers) is enough to satisfy all
 * three target behaviors at once: below the cap, content is naturally
 * 100% width (mobile) with comfortable padding (tablet); above it, it's
 * centered and no longer stretches edge-to-edge (desktop).
 */
export const CONTENT_MAX_WIDTH = {
  /** Auth/forms: always this narrow, even on a wide desktop viewport. */
  narrow: 520,
  /** General content pages (Home, Taleplerim, Takip, Profil, catalog). */
  default: 1120,
} as const;
