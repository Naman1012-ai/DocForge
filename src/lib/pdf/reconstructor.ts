import type { ExtractedTextItem, PdfLine, ImportSummary } from './types';
import {
  groupItemsIntoLines,
  filterRepeatedHeadersAndFooters,
  segmentPageIntoRegions,
  detectTableFromLines,
} from './layoutAnalyzer';

/**
 * Reconstructs a list of visual lines into structured Markdown blocks
 */
export function reconstructLinesToMarkdown(
  lines: PdfLine[],
  avgFontHeight: number
): { markdown: string; headings: number; paragraphs: number; lists: number; tables: number } {
  let headingCount = 0;
  let paragraphCount = 0;
  let listCount = 0;
  let tableCount = 0;

  const markdownBlocks: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      let fullPara = paragraphBuffer.join(' ');
      // Fix line-break hyphenation artifacts (e.g. "docu- ment" -> "document") while preserving legitimate hyphens (e.g. "state-of-the-art")
      fullPara = fullPara.replace(/(\b[a-zA-Z]{2,})-\s+([a-zA-Z]{2,}\b)/g, '$1$2');
      markdownBlocks.push(fullPara);
      paragraphCount++;
      paragraphBuffer = [];
    }
  };

  // Check if initial lines contain a table
  const tableCandidate = detectTableFromLines(lines);
  if (tableCandidate && tableCandidate.rows.length >= 1) {
    const headers = tableCandidate.headers || tableCandidate.rows[0];
    const rows = tableCandidate.headers ? tableCandidate.rows : tableCandidate.rows.slice(1);

    const tableMd = [
      `| ${headers.join(' | ')} |`,
      `| ${headers.map(() => ':---').join(' | ')} |`,
      ...rows.map((row) => `| ${row.join(' | ')} |`),
    ].join('\n');

    markdownBlocks.push(tableMd);
    tableCount++;
    // Skip the lines that formed the table (by Y coordinate range)
    lines = lines.filter((l) => l.y > tableCandidate.maxY + 3 || l.y < tableCandidate.minY - 3);
  }

  // Base X coordinate for list indentation calculation
  const baseX = lines.length > 0 ? Math.min(...lines.map((l) => l.x)) : 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text;
    if (text.length === 0) continue;

    const heightRatio = line.height / Math.max(10, avgFontHeight);

    // 1. Major Title / Heading 1
    // Criteria: Font height >= 1.4x average OR (isBold + starts with Chapter/Act/Scene/Number)
    const isMajorHeading =
      heightRatio >= 1.4 ||
      (line.isBold && /^((CHAPTER|ACT|SCENE)\s+[0-9IVXLCDM]+|[0-9]+\.\s+[A-Z\s]{3,})/i.test(text));

    if (isMajorHeading && text.length < 120 && !text.endsWith('.')) {
      flushParagraph();
      markdownBlocks.push(`## ${text.replace(/^#+\s*/, '')}`);
      headingCount++;
      continue;
    }

    // 2. Subheading (H2 / H3)
    // Criteria: Font height >= 1.2x average OR (isBold + short numbered section)
    const isSubheading =
      heightRatio >= 1.2 ||
      (line.isBold && /^([0-9]+\.[0-9]+(\.[0-9]+)?\s+[A-Za-z]|[A-Z][A-Za-z0-9\s]{3,40}$)/.test(text));

    if (isSubheading && text.length < 100 && !text.endsWith('.')) {
      flushParagraph();
      markdownBlocks.push(`### ${text.replace(/^#+\s*/, '')}`);
      headingCount++;
      continue;
    }

    // 3. Figure / Table Captions
    if (/^(figure|fig\.|table|exhibit)\s+[0-9a-z]+(\s*[:-])\s+/i.test(text)) {
      flushParagraph();
      markdownBlocks.push(`*${text}*`);
      paragraphCount++;
      continue;
    }

    // 4. Nested Unordered Bullet List Item
    if (/^[•◦▪‣\-*+]\s+(.+)/.test(text)) {
      flushParagraph();
      const indentLevel = Math.max(0, Math.floor((line.x - baseX) / 18));
      const indentPrefix = '  '.repeat(indentLevel);
      const cleanItemText = text.replace(/^[•◦▪‣\-*+]\s+/, '');
      markdownBlocks.push(`${indentPrefix}- ${cleanItemText}`);
      listCount++;
      continue;
    }

    // 5. Nested Numbered List Item
    if (/^(\d+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[.)]\s+(.+)/.test(text)) {
      flushParagraph();
      const indentLevel = Math.max(0, Math.floor((line.x - baseX) / 18));
      const indentPrefix = '  '.repeat(indentLevel);
      const match = text.match(/^(\d+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[.)]\s+(.+)/);
      const num = match ? match[1] : '1';
      const cleanItemText = match ? match[2] : text;
      markdownBlocks.push(`${indentPrefix}${num}. ${cleanItemText}`);
      listCount++;
      continue;
    }

    // 6. Horizontal Rule / Divider
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(text)) {
      flushParagraph();
      markdownBlocks.push('---');
      continue;
    }

    // 7. Standard Paragraph accumulation
    paragraphBuffer.push(text);
  }

  flushParagraph();

  return {
    markdown: markdownBlocks.join('\n\n'),
    headings: headingCount,
    paragraphs: paragraphCount,
    lists: listCount,
    tables: tableCount,
  };
}

/**
 * Reconstructs a full PDF document's extracted pages into clean Markdown with summary and warnings
 */
export function reconstructPdfDocument(pagesItemsList: ExtractedTextItem[][]): {
  markdown: string;
  summary: ImportSummary;
  warnings: string[];
} {
  const warnings: string[] = [];
  const reconstructedPagesMarkdown: string[] = [];

  let totalHeadingCount = 0;
  let totalParagraphCount = 0;
  let totalListCount = 0;
  let totalTableCount = 0;
  let multiColumnPagesCount = 0;

  // Calculate global average font height
  let totalFontHeight = 0;
  let totalItemCount = 0;

  pagesItemsList.forEach((pageItems) => {
    pageItems.forEach((item) => {
      if (item.str.trim().length > 0) {
        totalFontHeight += item.height;
        totalItemCount++;
      }
    });
  });

  const avgFontHeight = totalItemCount > 0 ? totalFontHeight / totalItemCount : 12;

  // 1. Group items into lines for each page
  const pagesLines = pagesItemsList.map((pageItems) => groupItemsIntoLines(pageItems));

  // 2. Filter out repeated running headers and footers across pages
  const { filteredPages, removedCount } = filterRepeatedHeadersAndFooters(pagesLines);
  if (removedCount > 0) {
    // Repeated headers/footers safely cleaned
  }

  // 3. Process each page's regions
  filteredPages.forEach((lines) => {
    if (lines.length === 0) return;

    // Segment page into multi-column and full-width regions
    const regions = segmentPageIntoRegions(lines, 600);
    const pageBlockParts: string[] = [];

    regions.forEach((region) => {
      if (region.type === 'multi-column' && region.columns && region.columns.length >= 2) {
        multiColumnPagesCount++;
        // Process columns in left-to-right reading order
        region.columns.forEach((col) => {
          if (col.lines.length > 0) {
            const colResult = reconstructLinesToMarkdown(col.lines, avgFontHeight);
            if (colResult.markdown.trim().length > 0) {
              pageBlockParts.push(colResult.markdown);
              totalHeadingCount += colResult.headings;
              totalParagraphCount += colResult.paragraphs;
              totalListCount += colResult.lists;
              totalTableCount += colResult.tables;
            }
          }
        });
      } else {
        const fullWidthResult = reconstructLinesToMarkdown(region.lines, avgFontHeight);
        if (fullWidthResult.markdown.trim().length > 0) {
          pageBlockParts.push(fullWidthResult.markdown);
          totalHeadingCount += fullWidthResult.headings;
          totalParagraphCount += fullWidthResult.paragraphs;
          totalListCount += fullWidthResult.lists;
          totalTableCount += fullWidthResult.tables;
        }
      }
    });

    if (pageBlockParts.length > 0) {
      reconstructedPagesMarkdown.push(pageBlockParts.join('\n\n'));
    }
  });

  const fullMarkdown = reconstructedPagesMarkdown.join('\n\n---\n\n');
  const wordCount = fullMarkdown.trim().split(/\s+/).filter(Boolean).length;

  if (multiColumnPagesCount > 0) {
    warnings.push(`Multi-column layout detected on ${multiColumnPagesCount} page(s). Reconstructed in column reading order.`);
  }

  if (pagesItemsList.length > 0 && fullMarkdown.trim().length === 0) {
    warnings.push('This PDF appears to be scanned or image-based. OCR is not currently supported in V1.');
  }

  const summary: ImportSummary = {
    pageCount: pagesItemsList.length,
    wordCount,
    headingCount: totalHeadingCount,
    paragraphCount: totalParagraphCount,
    listCount: totalListCount,
    tableCount: totalTableCount,
    multiColumnPagesCount,
  };

  return { markdown: fullMarkdown, summary, warnings };
}
