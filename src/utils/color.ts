/**
 * Color utility for validating, sanitizing, and calculating contrast ratios for document theme tokens
 */

/**
 * Validates whether a string is a valid 3-digit or 6-digit hex color
 */
export function isValidHexColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex.trim());
}

/**
 * Normalizes a hex color string (ensures leading #, 6 digits, lowercase)
 */
export function normalizeHexColor(hex: string, defaultColor: string = '#2563eb'): string {
  if (!isValidHexColor(hex)) return defaultColor;
  let clean = hex.trim();
  if (clean.length === 4) {
    clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean.toLowerCase();
}

/**
 * Calculates the relative luminance of a hex color (WCAG 2.1 formula)
 */
export function getRelativeLuminance(hex: string): number {
  const norm = normalizeHexColor(hex, '#000000').slice(1);
  const r = parseInt(norm.substring(0, 2), 16) / 255;
  const g = parseInt(norm.substring(2, 4), 16) / 255;
  const b = parseInt(norm.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Computes the WCAG contrast ratio between two hex colors (e.g. against #ffffff paper)
 */
export function getContrastRatio(hex1: string, hex2: string = '#ffffff'): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color has sufficient readability contrast on white paper (WCAG AA >= 3.0:1 for headings/accents)
 */
export function hasReadableContrast(hex: string, bgHex: string = '#ffffff', minRatio: number = 3.0): boolean {
  return getContrastRatio(hex, bgHex) >= minRatio;
}
