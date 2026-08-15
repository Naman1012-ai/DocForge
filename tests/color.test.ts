import { describe, it, expect } from 'vitest';
import {
  isValidHexColor,
  normalizeHexColor,
  getContrastRatio,
  hasReadableContrast,
} from '../src/utils/color';

describe('Color Utilities & WCAG Contrast Validation', () => {
  it('validates 3-digit and 6-digit hex colors accurately', () => {
    expect(isValidHexColor('#2563eb')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#000000')).toBe(true);
    expect(isValidHexColor('rgb(0,0,0)')).toBe(false);
    expect(isValidHexColor('blue')).toBe(false);
    expect(isValidHexColor('#xyz123')).toBe(false);
  });

  it('normalizes hex codes to 6-digit lowercase format', () => {
    expect(normalizeHexColor('#FFF')).toBe('#ffffff');
    expect(normalizeHexColor('#1E3A8A')).toBe('#1e3a8a');
    expect(normalizeHexColor('invalid', '#2563eb')).toBe('#2563eb');
  });

  it('calculates WCAG contrast ratio against white paper', () => {
    // Black on white is 21:1
    const blackRatio = getContrastRatio('#000000', '#ffffff');
    expect(blackRatio).toBeGreaterThan(20);

    // Deep navy on white has strong contrast
    const navyRatio = getContrastRatio('#1e3a8a', '#ffffff');
    expect(navyRatio).toBeGreaterThan(7);
  });

  it('detects unreadable low-contrast colors on white paper', () => {
    expect(hasReadableContrast('#0f172a')).toBe(true);
    expect(hasReadableContrast('#1e3a8a')).toBe(true);
    expect(hasReadableContrast('#fef08a')).toBe(false); // Very pale yellow
  });
});
