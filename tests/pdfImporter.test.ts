import { describe, it, expect } from 'vitest';
import {
  reconstructPdfToMarkdown,
  reconstructPdfDocument,
  extractPdfContent,
  type ExtractedTextItem,
} from '../src/lib/pdf/pdfImporter';

describe('PDF Importer & Document Reconstructor 2.0 (Phase 11 & 11.1)', () => {
  it('reconstructs visual lines into logical paragraphs and headings', () => {
    const pageItems: ExtractedTextItem[] = [
      // Title (Large font height 20)
      { str: 'Quarterly Financial Statement', x: 50, y: 750, height: 20, width: 250, fontName: 'Helvetica-Bold' },
      // Section Heading (Height 15)
      { str: 'Executive Summary', x: 50, y: 700, height: 15, width: 140, fontName: 'Helvetica-Bold' },
      // Paragraph line 1 (Height 10)
      { str: 'The company achieved record-breaking performance in the', x: 50, y: 660, height: 10, width: 300, fontName: 'Helvetica' },
      // Paragraph line 2 (Height 10)
      { str: 'third quarter with substantial growth across all sectors.', x: 50, y: 645, height: 10, width: 290, fontName: 'Helvetica' },
      // Bullet list item
      { str: '• Revenue increased by 24% year-over-year', x: 50, y: 600, height: 10, width: 220, fontName: 'Helvetica' },
      { str: '• Operating margin expanded to 18.5%', x: 50, y: 580, height: 10, width: 200, fontName: 'Helvetica' },
      // Numbered list item
      { str: '1. Complete cloud migration', x: 50, y: 540, height: 10, width: 160, fontName: 'Helvetica' },
      { str: '2. Launch client-side document editor', x: 50, y: 520, height: 10, width: 210, fontName: 'Helvetica' },
      // Running Page Number at bottom of page
      { str: 'Page 1 of 5', x: 250, y: 40, height: 8, width: 60, fontName: 'Helvetica' },
    ];

    const { markdown, warnings } = reconstructPdfToMarkdown([pageItems]);

    expect(markdown).toContain('## Quarterly Financial Statement');
    expect(markdown).toContain('### Executive Summary');
    expect(markdown).toContain('The company achieved record-breaking performance in the third quarter with substantial growth across all sectors.');
    expect(markdown).toContain('- Revenue increased by 24% year-over-year');
    expect(markdown).toContain('1. Complete cloud migration');
    expect(markdown).not.toContain('Page 1 of 5'); // Filtered running footer
    expect(warnings.length).toBe(0);
  });

  it('correctly classifies project_report.pdf as single-column without false-positive warning (Phase 11.1 Regression)', () => {
    // Exact structure of project_report.pdf Page 1
    const projectReportPage1: ExtractedTextItem[] = [
      // Executive Summary Heading
      { str: 'Executive Summary', x: 54, y: 720, height: 16, width: 150, fontName: 'Helvetica-Bold' },
      // Full-width paragraphs
      { str: 'This project report details the design and deployment of the high-performance local document synthesis pipeline.', x: 54, y: 690, height: 10, width: 490, fontName: 'Helvetica' },
      { str: 'All rendering and pagination calculations are conducted entirely on the client without third-party network egress.', x: 54, y: 675, height: 10, width: 485, fontName: 'Helvetica' },
      { str: 'The system achieves predictable physical page bounds matching ISO A4 and US Letter specifications.', x: 54, y: 660, height: 10, width: 470, fontName: 'Helvetica' },

      // Problem Statement Heading
      { str: 'Problem Statement', x: 54, y: 610, height: 14, width: 140, fontName: 'Helvetica-Bold' },
      // Full-width bullet list
      { str: '• Legacy document generators slice viewport canvases indiscriminately across pixel boundaries.', x: 54, y: 580, height: 10, width: 480, fontName: 'Helvetica' },
      { str: '• Slicing causes text clipping, overlapping lines, and unwanted border crossings through text.', x: 54, y: 560, height: 10, width: 475, fontName: 'Helvetica' },
      { str: '• The lack of discrete sheet containers eliminates running headers and footers on intermediate pages.', x: 54, y: 540, height: 10, width: 490, fontName: 'Helvetica' },

      // Running page number at the bottom
      { str: 'Page 1', x: 280, y: 35, height: 9, width: 35, fontName: 'Helvetica' },
    ];

    const result = reconstructPdfDocument([projectReportPage1]);

    expect(result.summary.multiColumnPagesCount).toBe(0);
    expect(result.warnings.some((w) => w.includes('Multi-column layout detected'))).toBe(false);
    expect(result.markdown).toContain('## Executive Summary');
    expect(result.markdown).toContain('### Problem Statement');
    expect(result.markdown).toContain('- Legacy document generators slice viewport canvases');
  });

  it('keeps single-column pages with uneven line lengths and short headings as single-column', () => {
    const singleColWithShortLines: ExtractedTextItem[] = [
      { str: 'Introduction', x: 50, y: 700, height: 14, width: 80, fontName: 'Helvetica-Bold' },
      { str: 'Short opening line.', x: 50, y: 670, height: 10, width: 110, fontName: 'Helvetica' },
      { str: 'This is a somewhat longer line of text that explains the general context in detail.', x: 50, y: 650, height: 10, width: 420, fontName: 'Helvetica' },
      { str: 'Closing sentence.', x: 50, y: 630, height: 10, width: 95, fontName: 'Helvetica' },
      { str: '• First key takeaway', x: 50, y: 590, height: 10, width: 140, fontName: 'Helvetica' },
      { str: '• Second key takeaway with extended explanation', x: 50, y: 570, height: 10, width: 280, fontName: 'Helvetica' },
    ];

    const result = reconstructPdfDocument([singleColWithShortLines]);

    expect(result.summary.multiColumnPagesCount).toBe(0);
    expect(result.warnings.some((w) => w.includes('Multi-column'))).toBe(false);
  });

  it('detects genuine two-column layouts and orders text left-to-right correctly', () => {
    // Page with 2 genuine parallel text columns spanning vertical region [700 -> 580]
    const twoColPageItems: ExtractedTextItem[] = [
      // Left Column lines (X = 40, Width = 180, Y = 700..580)
      { str: 'Left Column Heading', x: 40, y: 700, height: 14, width: 150, fontName: 'Helvetica-Bold' },
      { str: 'Left column paragraph line 1', x: 40, y: 670, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Left column paragraph line 2', x: 40, y: 650, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Left column paragraph line 3', x: 40, y: 630, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Left column paragraph line 4', x: 40, y: 610, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Left column paragraph line 5', x: 40, y: 590, height: 10, width: 180, fontName: 'Helvetica' },

      // Right Column lines (X = 320, Width = 180, Y = 700..580)
      { str: 'Right Column Heading', x: 320, y: 700, height: 14, width: 150, fontName: 'Helvetica-Bold' },
      { str: 'Right column paragraph line 1', x: 320, y: 670, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Right column paragraph line 2', x: 320, y: 650, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Right column paragraph line 3', x: 320, y: 630, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Right column paragraph line 4', x: 320, y: 610, height: 10, width: 180, fontName: 'Helvetica' },
      { str: 'Right column paragraph line 5', x: 320, y: 590, height: 10, width: 180, fontName: 'Helvetica' },
    ];

    const result = reconstructPdfDocument([twoColPageItems]);

    // Ensure Left Column content appears BEFORE Right Column content
    const leftIndex = result.markdown.indexOf('Left column paragraph line 5');
    const rightIndex = result.markdown.indexOf('Right Column Heading');
    expect(leftIndex).toBeLessThan(rightIndex);
    expect(result.summary.multiColumnPagesCount).toBe(1);
    expect(result.warnings.some((w) => w.includes('Multi-column layout detected'))).toBe(true);
  });

  it('reconstructs structured Markdown tables from multi-cell rows', () => {
    const tablePageItems: ExtractedTextItem[] = [
      // Row 1 (Headers)
      { str: 'Metric', x: 40, y: 700, height: 10, width: 50, fontName: 'Helvetica-Bold' },
      { str: 'Value', x: 180, y: 700, height: 10, width: 40, fontName: 'Helvetica-Bold' },
      { str: 'Status', x: 300, y: 700, height: 10, width: 40, fontName: 'Helvetica-Bold' },

      // Row 2
      { str: 'Throughput', x: 40, y: 680, height: 10, width: 70, fontName: 'Helvetica' },
      { str: '1,450 req/s', x: 180, y: 680, height: 10, width: 70, fontName: 'Helvetica' },
      { str: 'Healthy', x: 300, y: 680, height: 10, width: 50, fontName: 'Helvetica' },

      // Row 3
      { str: 'P99 Latency', x: 40, y: 660, height: 10, width: 70, fontName: 'Helvetica' },
      { str: '12.4 ms', x: 180, y: 660, height: 10, width: 45, fontName: 'Helvetica' },
      { str: 'Passed', x: 300, y: 660, height: 10, width: 45, fontName: 'Helvetica' },
    ];

    const result = reconstructPdfDocument([tablePageItems]);

    expect(result.markdown).toContain('| Metric | Value | Status |');
    expect(result.markdown).toContain('| Throughput | 1,450 req/s | Healthy |');
    expect(result.summary.tableCount).toBe(1);
  });

  it('reconstructs nested list hierarchy using indentation offsets', () => {
    const nestedListItems: ExtractedTextItem[] = [
      { str: '• Main bullet item 1', x: 40, y: 700, height: 10, width: 120, fontName: 'Helvetica' },
      { str: '• Sub-bullet point A', x: 65, y: 680, height: 10, width: 110, fontName: 'Helvetica' },
      { str: '• Sub-bullet point B', x: 65, y: 660, height: 10, width: 110, fontName: 'Helvetica' },
      { str: '• Main bullet item 2', x: 40, y: 640, height: 10, width: 120, fontName: 'Helvetica' },
    ];

    const result = reconstructPdfDocument([nestedListItems]);

    expect(result.markdown).toContain('- Main bullet item 1');
    expect(result.markdown).toContain('  - Sub-bullet point A');
    expect(result.markdown).toContain('  - Sub-bullet point B');
    expect(result.markdown).toContain('- Main bullet item 2');
  });

  it('cleans up line-break hyphenation while preserving legitimate hyphens', () => {
    const pageItems: ExtractedTextItem[] = [
      { str: 'DocFrame provides high-perfor- ', x: 50, y: 700, height: 10, width: 150, fontName: 'Helvetica' },
      { str: 'mance state-of-the-art client-side document synthesis.', x: 50, y: 685, height: 10, width: 260, fontName: 'Helvetica' },
    ];

    const { markdown } = reconstructPdfToMarkdown([pageItems]);
    expect(markdown).toContain('high-performance');
    expect(markdown).toContain('state-of-the-art');
    expect(markdown).toContain('client-side');
  });

  it('detects figure and table captions', () => {
    const pageItems: ExtractedTextItem[] = [
      { str: 'Figure 1: Architectural diagram of the local rendering engine', x: 50, y: 600, height: 9, width: 280, fontName: 'Helvetica-Oblique' },
    ];

    const { markdown } = reconstructPdfToMarkdown([pageItems]);
    expect(markdown).toContain('*Figure 1: Architectural diagram of the local rendering engine*');
  });

  it('detects scanned / image-only PDFs and warns user', () => {
    const emptyPageItems: ExtractedTextItem[] = [];
    const { warnings } = reconstructPdfToMarkdown([emptyPageItems]);
    expect(warnings).toBeDefined();
  });

  it('rejects oversized PDF files (> 25MB)', async () => {
    const largeFile = new File(['a'.repeat(100)], 'large_document.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 30 * 1024 * 1024 });

    const result = await extractPdfContent(largeFile, 'large_document.pdf');
    expect(result.success).toBe(false);
    expect(result.error).toContain('too large');
  });
});
