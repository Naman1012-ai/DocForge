/**
 * Document Page Settings, Customization Options & Geometry Types (Phase 14)
 */

export type PageFormat = 'a4' | 'letter' | 'legal';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginSize = 'compact' | 'standard' | 'relaxed' | 'custom';
export type FontSizeScale = 'compact' | 'standard' | 'large';
export type LineSpacingOption = 'compact' | 'standard' | 'relaxed';
export type ParagraphSpacingOption = 'compact' | 'standard' | 'spacious';
export type HeadingSpacingOption = 'compact' | 'standard' | 'spacious';
export type TextAlignmentOption = 'left' | 'justify';
export type PageNumberPosition = 'left' | 'center' | 'right';
export type TableDensity = 'compact' | 'standard' | 'spacious';

export interface CustomMarginMetrics {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MarginMetrics {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface PageSettings {
  format: PageFormat;
  orientation: PageOrientation;
  margins: MarginSize;
  customMargins?: CustomMarginMetrics;
  fontSizeScale: FontSizeScale;
  lineSpacing: LineSpacingOption;
  paragraphSpacing?: ParagraphSpacingOption;
  headingSpacing?: HeadingSpacingOption;
  textAlignment?: TextAlignmentOption;
  customAccentColor?: string;
  showPageNumbers: boolean;
  pageNumberPosition?: PageNumberPosition;
  showHeader: boolean;
  showFooter: boolean;
  hideHeaderOnFirstPage?: boolean;
  headerText?: string;
  footerText?: string;
  tableDensity?: TableDensity;
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  format: 'a4',
  orientation: 'portrait',
  margins: 'standard',
  fontSizeScale: 'standard',
  lineSpacing: 'standard',
  paragraphSpacing: 'standard',
  headingSpacing: 'standard',
  textAlignment: 'left',
  showPageNumbers: true,
  pageNumberPosition: 'right',
  showHeader: false,
  showFooter: true,
  hideHeaderOnFirstPage: false,
  tableDensity: 'standard',
};

export const MARGIN_PRESETS: Record<Exclude<MarginSize, 'custom'>, MarginMetrics> = {
  compact: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
  standard: { top: '25mm', right: '25mm', bottom: '25mm', left: '25mm' },
  relaxed: { top: '35mm', right: '35mm', bottom: '35mm', left: '35mm' },
};
