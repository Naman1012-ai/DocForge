/**
 * DocFrame Phase 11 — PDF Import & Layout Reconstruction Types
 */

export interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

export interface PdfLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  isBold: boolean;
  items: ExtractedTextItem[];
}

export interface PdfColumn {
  index: number;
  minX: number;
  maxX: number;
  lines: PdfLine[];
}

export interface PdfRegion {
  type: 'full-width' | 'multi-column' | 'table';
  minY: number;
  maxY: number;
  lines: PdfLine[];
  columns?: PdfColumn[];
}

export interface PdfTableData {
  headers?: string[];
  rows: string[][];
  minY: number;
  maxY: number;
}

export interface ImportSummary {
  pageCount: number;
  wordCount: number;
  headingCount: number;
  paragraphCount: number;
  listCount: number;
  tableCount: number;
  multiColumnPagesCount: number;
}

export interface ImportedPdfResult {
  success: boolean;
  title: string;
  markdownContent: string;
  pageCount: number;
  wordCount: number;
  summary?: ImportSummary;
  warnings: string[];
  error?: string;
}
