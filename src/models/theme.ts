import type { FontSizeScale, LineSpacingOption, PageSettings } from './settings';
import { isValidHexColor, normalizeHexColor } from '../utils/color';

export type FontFamilyChoice = 'sans' | 'serif' | 'mono';
export type ThemeId = 'minimal' | 'executive' | 'academic' | 'technical' | 'modern';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: 'monochrome' | 'corporate' | 'scholarly' | 'technical' | 'contemporary';
  description: string;
  sampleSubtitle: string;

  /* Typography Design Tokens */
  fontFamily: FontFamilyChoice;
  headingFontFamily: FontFamilyChoice;
  codeFontFamily: FontFamilyChoice;
  bodyFontSize: string;
  bodyLineHeight: number;
  headingWeight: number;
  titleAlignment: 'left' | 'center';

  /* Color Design Tokens */
  primaryColor: string;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  headingColor: string;
  borderColor: string;
  codeBgColor: string;
  codeTextColor: string;
  codeBorderColor: string;
  accentBarColor: string;
  tableHeaderBg: string;
  tableBorderColor: string;
  quoteBgColor: string;
  quoteTextColor: string;
  pageBgColor: string;

  /* Spacing Design Tokens */
  paragraphMarginBottom: string;
  headingMarginTop: string;
  headingMarginBottom: string;
  blockSpacing: string;

  /* Structural Elements */
  tableStyle: 'minimal' | 'executive' | 'academic' | 'technical';
  codeStyle: 'dark-badge' | 'light-boxed' | 'classic';
  quoteStyle: 'accent-bar' | 'serif-italic' | 'academic-bracket';
  dividerStyle: 'solid' | 'subtle' | 'accent';
}

export const THEME_PRESETS: Record<ThemeId, ThemeConfig> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    category: 'monochrome',
    description: 'Restrained typography with generous whitespace and high-contrast monochrome hierarchy.',
    sampleSubtitle: 'Pure Clarity • Restrained Layout',
    fontFamily: 'sans',
    headingFontFamily: 'sans',
    codeFontFamily: 'mono',
    bodyFontSize: '10.5pt',
    bodyLineHeight: 1.65,
    headingWeight: 600,
    titleAlignment: 'left',
    primaryColor: '#0f172a',
    accentColor: '#475569',
    textColor: '#1e293b',
    secondaryTextColor: '#64748b',
    headingColor: '#0f172a',
    borderColor: '#e2e8f0',
    codeBgColor: '#f8fafc',
    codeTextColor: '#0f172a',
    codeBorderColor: '#e2e8f0',
    accentBarColor: '#0f172a',
    tableHeaderBg: '#f8fafc',
    tableBorderColor: '#e2e8f0',
    quoteBgColor: 'transparent',
    quoteTextColor: '#334155',
    pageBgColor: '#ffffff',
    paragraphMarginBottom: '1em',
    headingMarginTop: '1.4em',
    headingMarginBottom: '0.4em',
    blockSpacing: '1.2em',
    tableStyle: 'minimal',
    codeStyle: 'light-boxed',
    quoteStyle: 'serif-italic',
    dividerStyle: 'subtle',
  },
  executive: {
    id: 'executive',
    name: 'Professional / Executive',
    category: 'corporate',
    description: 'Polished corporate layout with rich navy headings, elegant rule lines, and structured tables.',
    sampleSubtitle: 'Executive Briefing • Formal Presentation',
    fontFamily: 'sans',
    headingFontFamily: 'serif',
    codeFontFamily: 'mono',
    bodyFontSize: '10.5pt',
    bodyLineHeight: 1.6,
    headingWeight: 700,
    titleAlignment: 'left',
    primaryColor: '#1e3a8a',
    accentColor: '#1d4ed8',
    textColor: '#1e293b',
    secondaryTextColor: '#475569',
    headingColor: '#0f2757',
    borderColor: '#cbd5e1',
    codeBgColor: '#f1f5f9',
    codeTextColor: '#0f172a',
    codeBorderColor: '#cbd5e1',
    accentBarColor: '#1e3a8a',
    tableHeaderBg: '#f1f5f9',
    tableBorderColor: '#cbd5e1',
    quoteBgColor: 'rgba(30, 58, 138, 0.03)',
    quoteTextColor: '#334155',
    pageBgColor: '#ffffff',
    paragraphMarginBottom: '1em',
    headingMarginTop: '1.4em',
    headingMarginBottom: '0.5em',
    blockSpacing: '1.3em',
    tableStyle: 'executive',
    codeStyle: 'light-boxed',
    quoteStyle: 'accent-bar',
    dividerStyle: 'accent',
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    category: 'scholarly',
    description: 'Classic editorial serif composition tailored for formal research papers, essays, and reports.',
    sampleSubtitle: 'Research Publication • Scholarly Typography',
    fontFamily: 'serif',
    headingFontFamily: 'serif',
    codeFontFamily: 'mono',
    bodyFontSize: '11pt',
    bodyLineHeight: 1.7,
    headingWeight: 700,
    titleAlignment: 'center',
    primaryColor: '#334155',
    accentColor: '#475569',
    textColor: '#1c1917',
    secondaryTextColor: '#57534e',
    headingColor: '#0c0a09',
    borderColor: '#d6d3d1',
    codeBgColor: '#f5f5f4',
    codeTextColor: '#1c1917',
    codeBorderColor: '#d6d3d1',
    accentBarColor: '#78716c',
    tableHeaderBg: '#f5f5f4',
    tableBorderColor: '#a8a29e',
    quoteBgColor: 'transparent',
    quoteTextColor: '#292524',
    pageBgColor: '#ffffff',
    paragraphMarginBottom: '1.1em',
    headingMarginTop: '1.5em',
    headingMarginBottom: '0.5em',
    blockSpacing: '1.4em',
    tableStyle: 'academic',
    codeStyle: 'classic',
    quoteStyle: 'academic-bracket',
    dividerStyle: 'solid',
  },
  technical: {
    id: 'technical',
    name: 'Technical / Engineering',
    category: 'technical',
    description: 'Developer-oriented layout with high-contrast code blocks, crisp sans typography, and tech styling.',
    sampleSubtitle: 'Software Architecture • API Specification',
    fontFamily: 'sans',
    headingFontFamily: 'mono',
    codeFontFamily: 'mono',
    bodyFontSize: '10pt',
    bodyLineHeight: 1.55,
    headingWeight: 600,
    titleAlignment: 'left',
    primaryColor: '#0284c7',
    accentColor: '#0369a1',
    textColor: '#0f172a',
    secondaryTextColor: '#475569',
    headingColor: '#0369a1',
    borderColor: '#cbd5e1',
    codeBgColor: '#0b0f19',
    codeTextColor: '#f8fafc',
    codeBorderColor: '#1e293b',
    accentBarColor: '#0284c7',
    tableHeaderBg: '#f8fafc',
    tableBorderColor: '#cbd5e1',
    quoteBgColor: 'rgba(2, 132, 199, 0.04)',
    quoteTextColor: '#334155',
    pageBgColor: '#ffffff',
    paragraphMarginBottom: '0.9em',
    headingMarginTop: '1.3em',
    headingMarginBottom: '0.4em',
    blockSpacing: '1.1em',
    tableStyle: 'technical',
    codeStyle: 'dark-badge',
    quoteStyle: 'accent-bar',
    dividerStyle: 'accent',
  },
  modern: {
    id: 'modern',
    name: 'Modern Clean',
    category: 'contemporary',
    description: 'Balanced contemporary layout with crisp typography and vibrant indigo accents.',
    sampleSubtitle: 'Modern Design • Versatile Document',
    fontFamily: 'sans',
    headingFontFamily: 'sans',
    codeFontFamily: 'mono',
    bodyFontSize: '10.5pt',
    bodyLineHeight: 1.6,
    headingWeight: 700,
    titleAlignment: 'left',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    textColor: '#1e293b',
    secondaryTextColor: '#64748b',
    headingColor: '#0f172a',
    borderColor: '#e2e8f0',
    codeBgColor: '#f1f5f9',
    codeTextColor: '#0f172a',
    codeBorderColor: '#e2e8f0',
    accentBarColor: '#2563eb',
    tableHeaderBg: '#f8fafc',
    tableBorderColor: '#e2e8f0',
    quoteBgColor: 'rgba(37, 99, 235, 0.03)',
    quoteTextColor: '#334155',
    pageBgColor: '#ffffff',
    paragraphMarginBottom: '1em',
    headingMarginTop: '1.4em',
    headingMarginBottom: '0.5em',
    blockSpacing: '1.25em',
    tableStyle: 'minimal',
    codeStyle: 'light-boxed',
    quoteStyle: 'accent-bar',
    dividerStyle: 'accent',
  },
};

/**
 * Resolves effective design tokens combining theme presets and user overrides
 */
export function resolveThemeTokens(themeId: ThemeId, settings: PageSettings): ThemeConfig {
  const baseTheme = THEME_PRESETS[themeId] || THEME_PRESETS.modern;

  // Clone base configuration
  const resolved: ThemeConfig = { ...baseTheme };

  // 1. Custom Accent Color Override
  if (settings.customAccentColor && isValidHexColor(settings.customAccentColor)) {
    const cleanHex = normalizeHexColor(settings.customAccentColor);
    resolved.primaryColor = cleanHex;
    resolved.accentColor = cleanHex;
    resolved.accentBarColor = cleanHex;
  }

  // 2. Font Size Scaling
  const scaleMap: Record<FontSizeScale, string> = {
    compact: '9.5pt',
    standard: baseTheme.bodyFontSize,
    large: '11.5pt',
  };
  if (settings.fontSizeScale && scaleMap[settings.fontSizeScale]) {
    resolved.bodyFontSize = scaleMap[settings.fontSizeScale];
  }

  // 3. Line Spacing Scaling
  const lineSpacingMap: Record<LineSpacingOption, number> = {
    compact: baseTheme.bodyLineHeight * 0.9,
    standard: baseTheme.bodyLineHeight,
    relaxed: baseTheme.bodyLineHeight * 1.15,
  };
  if (settings.lineSpacing && lineSpacingMap[settings.lineSpacing]) {
    resolved.bodyLineHeight = parseFloat(lineSpacingMap[settings.lineSpacing].toFixed(2));
  }

  // 4. Paragraph Spacing Scaling
  if (settings.paragraphSpacing === 'compact') {
    resolved.paragraphMarginBottom = '0.65em';
  } else if (settings.paragraphSpacing === 'spacious') {
    resolved.paragraphMarginBottom = '1.35em';
  }

  // 5. Heading Spacing Scaling
  if (settings.headingSpacing === 'compact') {
    resolved.headingMarginTop = '0.9em';
    resolved.headingMarginBottom = '0.3em';
  } else if (settings.headingSpacing === 'spacious') {
    resolved.headingMarginTop = '1.8em';
    resolved.headingMarginBottom = '0.7em';
  }

  return resolved;
}
