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
 * per variant (rather than separate per-breakpoint numbers) is enough to
 * satisfy mobile/tablet/desktop at once: below the cap, content is
 * naturally 100% width (mobile) with comfortable padding (tablet); above
 * it, it's centered and no longer stretches edge-to-edge (desktop).
 *
 * Three tiers, chosen from what each screen's content actually looks
 * like stretched wide, not a guess:
 * - narrow: auth screens (2-3 simple fields) — Sign In/Up, Forgot/Reset
 *   Password, auth callback, and every RequireAuth/RequireRole gated
 *   state (a short message + one button looks stretched-thin well
 *   before 1120px).
 * - medium: single-column list/detail content — the request form,
 *   Taleplerim, Takip, and the category service-type list. Wide enough
 *   for a comfortable textarea/card without turning a list of cards
 *   into one gigantic stretched card.
 * - default: genuinely wide content — currently only Home, whose
 *   category grid is meant to use the full width via more columns
 *   (see getGridColumns below), not a wider single column.
 */
export const CONTENT_MAX_WIDTH = {
  narrow: 520,
  medium: 760,
  default: 1120,
} as const;

/**
 * How many columns Home's category grid should use. Centralized here
 * (rather than duplicated inline math) so the "how wide is a column"
 * question has one answer.
 */
export function getGridColumns(screenSize: ScreenSize): number {
  if (screenSize === "desktop") return 4;
  if (screenSize === "tablet") return 3;
  return 2;
}

/**
 * Percentage width for a grid item in a `flexWrap: "wrap"` row with a
 * `gap` between items. Deliberately undershoots an even split (e.g. 4
 * columns isn't a flat 25%) to leave room for the gaps themselves,
 * matching the existing, already-shipped 2-column value (47.5%, not
 * 50%) that this table simply extends to 1, 3 and 4 columns.
 */
export const GRID_ITEM_WIDTH_PERCENT: Record<number, `${number}%`> = {
  1: "100%",
  2: "47.5%",
  3: "31%",
  4: "23%",
};
