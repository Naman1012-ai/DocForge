import { describe, it, expect } from 'vitest';
import { THEME_PRESETS, resolveThemeTokens, type ThemeId } from '../src/models/theme';
import { DEFAULT_PAGE_SETTINGS, type PageSettings } from '../src/models/settings';

describe('Theme Design Token System & Token Resolver', () => {
  it('contains comprehensive design tokens for all 5 required theme presets', () => {
    const themeIds: ThemeId[] = ['minimal', 'executive', 'academic', 'technical', 'modern'];
    for (const id of themeIds) {
      const theme = THEME_PRESETS[id];
      expect(theme).toBeDefined();
      expect(theme.name).toBeDefined();
      expect(theme.fontFamily).toBeDefined();
      expect(theme.headingFontFamily).toBeDefined();
      expect(theme.bodyFontSize).toBeDefined();
      expect(theme.bodyLineHeight).toBeGreaterThan(1);
      expect(theme.tableStyle).toBeDefined();
      expect(theme.quoteStyle).toBeDefined();
    }
  });

  it('resolves custom accent color override correctly', () => {
    const settings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      customAccentColor: '#be123c',
    };

    const resolved = resolveThemeTokens('modern', settings);
    expect(resolved.primaryColor).toBe('#be123c');
    expect(resolved.accentColor).toBe('#be123c');
    expect(resolved.accentBarColor).toBe('#be123c');
  });

  it('resolves font size scaling correctly', () => {
    const compactSettings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      fontSizeScale: 'compact',
    };
    const resolvedCompact = resolveThemeTokens('modern', compactSettings);
    expect(resolvedCompact.bodyFontSize).toBe('9.5pt');

    const largeSettings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      fontSizeScale: 'large',
    };
    const resolvedLarge = resolveThemeTokens('modern', largeSettings);
    expect(resolvedLarge.bodyFontSize).toBe('11.5pt');
  });

  it('handles invalid theme IDs gracefully with modern fallback', () => {
    const resolved = resolveThemeTokens('invalid' as ThemeId, DEFAULT_PAGE_SETTINGS);
    expect(resolved.id).toBe('modern');
  });
});
