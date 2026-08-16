import { describe, it, expect } from 'vitest';
import { calculateMetadata } from '../src/models/document';
import { THEME_PRESETS, type ThemeId } from '../src/models/theme';

describe('Document Model & Metadata', () => {
  it('calculates word, line, and char counts accurately', () => {
    const content = 'Hello world from DocFrame.\nSecond line with five words.';
    const meta = calculateMetadata(content);
    expect(meta.wordCount).toBe(9);
    expect(meta.lineCount).toBe(2);
    expect(meta.charCount).toBe(content.length);
    expect(meta.readingTimeMinutes).toBe(1);
  });

  it('handles empty content gracefully', () => {
    const meta = calculateMetadata('');
    expect(meta.wordCount).toBe(0);
    expect(meta.lineCount).toBe(0);
    expect(meta.charCount).toBe(0);
  });

  it('validates that all required theme presets have essential typography and color tokens', () => {
    const requiredThemes: ThemeId[] = ['minimal', 'executive', 'academic', 'technical', 'modern'];
    for (const id of requiredThemes) {
      const theme = THEME_PRESETS[id];
      expect(theme).toBeDefined();
      expect(theme.primaryColor).toMatch(/^#/);
      expect(theme.headingColor).toMatch(/^#/);
      expect(theme.fontFamily).toBeDefined();
      expect(theme.bodyLineHeight).toBeGreaterThan(1);
    }
  });
});
