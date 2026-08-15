import { describe, it, expect } from 'vitest';
import {
  calculatePageDimensions,
  paginateDocumentHtml,
} from '../src/lib/pagination/paginator';
import {
  DEFAULT_PAGE_SETTINGS,
  type PageSettings,
} from '../src/models/settings';
import { THEME_PRESETS, resolveThemeTokens } from '../src/models/theme';

describe('Advanced Document Controls & Layout Configuration (Phase 14)', () => {
  it('calculates accurate page dimensions for A4, Letter, and Legal formats', () => {
    const a4Dimensions = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      format: 'a4',
      orientation: 'portrait',
    });
    expect(a4Dimensions.pageWidthMm).toBe(210.0);
    expect(a4Dimensions.pageHeightMm).toBe(297.0);

    const letterDimensions = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      format: 'letter',
      orientation: 'portrait',
    });
    expect(letterDimensions.pageWidthMm).toBe(215.9);
    expect(letterDimensions.pageHeightMm).toBe(279.4);

    const legalDimensions = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      format: 'legal',
      orientation: 'portrait',
    });
    expect(legalDimensions.pageWidthMm).toBe(215.9);
    expect(legalDimensions.pageHeightMm).toBe(355.6);
  });

  it('swaps width and height dimensions when Landscape orientation is selected', () => {
    const portrait = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      format: 'a4',
      orientation: 'portrait',
    });
    const landscape = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      format: 'a4',
      orientation: 'landscape',
    });

    expect(landscape.pageWidthMm).toBe(portrait.pageHeightMm);
    expect(landscape.pageHeightMm).toBe(portrait.pageWidthMm);
  });

  it('calculates usable area for compact, standard, and relaxed margins', () => {
    const compact = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      margins: 'compact',
    });
    const standard = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      margins: 'standard',
    });
    const relaxed = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      margins: 'relaxed',
    });

    expect(compact.marginTopMm).toBe(15.0);
    expect(standard.marginTopMm).toBe(25.0);
    expect(relaxed.marginTopMm).toBe(35.0);

    expect(compact.usableWidthPx).toBeGreaterThan(standard.usableWidthPx);
    expect(standard.usableWidthPx).toBeGreaterThan(relaxed.usableWidthPx);
  });

  it('clamps custom margins safely within sensible boundaries (8mm to 50mm)', () => {
    const customUnderflow = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      margins: 'custom',
      customMargins: { top: 2, right: 3, bottom: 4, left: 5 },
    });
    expect(customUnderflow.marginTopMm).toBe(8.0);
    expect(customUnderflow.marginLeftMm).toBe(8.0);

    const customOverflow = calculatePageDimensions({
      ...DEFAULT_PAGE_SETTINGS,
      margins: 'custom',
      customMargins: { top: 90, right: 100, bottom: 80, left: 75 },
    });
    expect(customOverflow.marginTopMm).toBe(50.0);
    expect(customOverflow.marginRightMm).toBe(50.0);
  });

  it('resolves typography overrides (font scale, line spacing, paragraph/heading spacing) cleanly', () => {
    const settings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      fontSizeScale: 'large',
      lineSpacing: 'relaxed',
      paragraphSpacing: 'spacious',
      headingSpacing: 'compact',
    };

    const resolved = resolveThemeTokens('modern', settings);
    expect(resolved.bodyFontSize).toBe('11.5pt');
    expect(resolved.bodyLineHeight).toBeGreaterThan(THEME_PRESETS.modern.bodyLineHeight);
    expect(resolved.paragraphMarginBottom).toBe('1.35em');
    expect(resolved.headingMarginTop).toBe('0.9em');
    expect(resolved.headingMarginBottom).toBe('0.3em');
  });

  it('supports explicit page breaks in document pagination', () => {
    const rawHtml = '<p>First page content before page break.</p><hr class="page-break"><p>Second page content after page break.</p>';
    const pages = paginateDocumentHtml(rawHtml, DEFAULT_PAGE_SETTINGS, THEME_PRESETS.modern);

    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages[0]).toContain('First page content');
    expect(pages[1]).toContain('Second page content');
  });
});
