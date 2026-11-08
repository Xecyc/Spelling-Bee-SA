// Unified Stage Wheel Color Palettes & Text Contrast Engine
// Strictly calibrated to W3C YIQ perceived luminance with lowered threshold (95)

export const VIBRANT_STAGE_PALETTE = [
  '#FACC15', // Golden Yellow
  '#4ADE80', // Vibrant Mint Green
  '#60A5FA', // Sky Blue
  '#F472B6', // Bright Pink
  '#FB923C', // Warm Bright Orange (luminance > 95 so text stays dark)
  '#A78BFA', // Soft Lavender Purple
  '#2DD4BF', // Bright Teal
  '#F87171', // Soft Coral Red
];

export const CHAMPIONSHIP_PALETTE = [
  '#1E3A8A', // Deep Royal Blue (White Text)
  '#FACC15', // Golden Yellow (Dark Navy Text)
  '#0F2557', // Midnight Blue (White Text)
  '#F8FAFC', // Crisp Slate White (Dark Navy Text)
];

// Unified text contrast logic (YIQ threshold adjustment)
// Threshold lowered from 128 to 95 so bright/pastel palettes maintain 100% uniform Dark Navy text
export function getSliceTextColor(bgHex: string): string {
  const hex = bgHex.replace('#', '').trim();
  if (hex.length !== 6) return '#0F172A';

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // W3C YIQ perceived luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // CRITICAL: Threshold is lowered from 128 to 95.
  // This ensures all vibrant/pastel slices (including warm orange, coral, and lavender)
  // consistently render with crisp Dark Navy (#0F172A) text, reserving Pure White (#FFFFFF)
  // strictly for genuinely dark jewel/midnight palettes.
  return yiq >= 95 ? '#0F172A' : '#FFFFFF';
}

// Cyclic color assignment with "Odd-Boundary" protection
// Prevents adjacent slices or last-to-first slice color collisions
export function getBalancedSliceColor(
  index: number,
  totalSlices: number,
  palette: string[] = VIBRANT_STAGE_PALETTE
): string {
  const len = palette.length;
  let colorIndex = index % len;

  // 1. Prevent the last slice from matching the first slice (index 0)
  if (totalSlices > 1 && index === totalSlices - 1 && colorIndex === 0) {
    colorIndex = 1 % len;
  }

  // 2. Ensure the shifted last slice does not collide with the second-to-last slice
  if (
    totalSlices > 2 &&
    index === totalSlices - 1 &&
    colorIndex === (index - 1) % len
  ) {
    colorIndex = 2 % len;
  }

  return palette[colorIndex];
}

// Recalibrate all slices in an array to ensure odd-boundary protection and balanced colors
export function recalibrateSliceColors<T extends { color?: string }>(
  slices: T[],
  palette: string[] = VIBRANT_STAGE_PALETTE
): T[] {
  return slices.map((slice, index) => ({
    ...slice,
    color: getBalancedSliceColor(index, slices.length, palette),
  }));
}
