import type { ExtractedTextItem, PdfLine, PdfRegion, PdfColumn, PdfTableData } from './types';

/**
 * Groups raw extracted text fragments into coherent visual lines
 */
export function groupItemsIntoLines(items: ExtractedTextItem[]): PdfLine[] {
  if (items.length === 0) return [];

  // Sort items primarily top-to-bottom (descending Y in PDF coordinates) then left-to-right (ascending X)
  const sorted = [...items].sort((a, b) => {
    const yDiff = Math.abs(a.y - b.y);
    if (yDiff <= 3.5) {
      return a.x - b.x;
    }
    return b.y - a.y; // PDF Y is from bottom to top
  });

  const lines: PdfLine[] = [];
  let currentItems: ExtractedTextItem[] = [];
  let currentY = -999;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];

    if (currentItems.length === 0) {
      currentItems = [item];
      currentY = item.y;
    } else if (Math.abs(item.y - currentY) <= 3.5) {
      const lastItem = currentItems[currentItems.length - 1];
      const horizontalGap = item.x - (lastItem.x + lastItem.width);
      if (horizontalGap > 35) {
        // Large column gap on same Y line: split into separate column lines
        lines.push(createLineFromItems(currentItems));
        currentItems = [item];
        currentY = item.y;
      } else {
        currentItems.push(item);
      }
    } else {
      // Create line from current items
      lines.push(createLineFromItems(currentItems));
      currentItems = [item];
      currentY = item.y;
    }
  }

  if (currentItems.length > 0) {
    lines.push(createLineFromItems(currentItems));
  }

  return lines;
}

function createLineFromItems(items: ExtractedTextItem[]): PdfLine {
  const sorted = [...items].sort((a, b) => a.x - b.x);

  let fullText = '';
  let minX = Infinity;
  let maxX = -Infinity;
  let maxHeight = 0;
  let dominantFont = 'sans-serif';
  let isBold = false;

  sorted.forEach((item) => {
    const str = item.str;
    if (str.length === 0) return;

    if (fullText.length > 0 && !fullText.endsWith(' ') && !str.startsWith(' ')) {
      fullText += ' ';
    }
    fullText += str;

    minX = Math.min(minX, item.x);
    maxX = Math.max(maxX, item.x + item.width);
    maxHeight = Math.max(maxHeight, item.height);

    if (item.fontName && item.fontName !== 'sans-serif') {
      dominantFont = item.fontName;
      if (/bold|black|heavy/i.test(item.fontName)) {
        isBold = true;
      }
    }
  });

  return {
    text: fullText.trim(),
    x: minX === Infinity ? 0 : minX,
    y: sorted[0]?.y || 0,
    width: maxX === -Infinity ? 0 : Math.max(0, maxX - minX),
    height: maxHeight || 12,
    fontName: dominantFont,
    isBold,
    items: sorted,
  };
}

/**
 * Detects and filters out repeated running headers and footers across pages
 */
export function filterRepeatedHeadersAndFooters(pagesLines: PdfLine[][]): { filteredPages: PdfLine[][]; removedCount: number } {
  if (pagesLines.length === 0) return { filteredPages: [], removedCount: 0 };

  let removedCount = 0;
  const headerCandidates = new Map<string, number>();
  const footerCandidates = new Map<string, number>();

  if (pagesLines.length >= 2) {
    pagesLines.forEach((lines) => {
      if (lines.length === 0) return;
      const topLine = lines[0]?.text.trim().toLowerCase();
      const bottomLine = lines[lines.length - 1]?.text.trim().toLowerCase();

      if (topLine && topLine.length > 2) {
        headerCandidates.set(topLine, (headerCandidates.get(topLine) || 0) + 1);
      }
      if (bottomLine && bottomLine.length > 2) {
        footerCandidates.set(bottomLine, (footerCandidates.get(bottomLine) || 0) + 1);
      }
    });
  }

  const threshold = Math.max(2, Math.floor(pagesLines.length * 0.45));

  const filteredPages = pagesLines.map((lines) => {
    return lines.filter((line, idx) => {
      const text = line.text.trim();
      const lower = text.toLowerCase();

      // 1. Filter out isolated page numbers at page extremes
      if (/^(page\s+\d+(\s+of\s+\d+)?|\d+(\s*\/\s*\d+)?|\d+)$/i.test(text)) {
        if (idx === 0 || idx >= lines.length - 2) {
          removedCount++;
          return false;
        }
      }

      // 2. Filter out repeated running headers/footers
      if (idx === 0 && (headerCandidates.get(lower) || 0) >= threshold) {
        removedCount++;
        return false;
      }
      if (idx >= lines.length - 2 && (footerCandidates.get(lower) || 0) >= threshold) {
        removedCount++;
        return false;
      }

      return true;
    });
  });

  return { filteredPages, removedCount };
}

/**
 * Attempts to detect structured table rows from visual lines with multi-column alignment
 */
export function detectTableFromLines(lines: PdfLine[]): PdfTableData | null {
  if (lines.length < 2) return null;

  // Group lines by Y level
  const yRows = new Map<number, PdfLine[]>();
  lines.forEach((line) => {
    let matchedY = -1;
    for (const existingY of yRows.keys()) {
      if (Math.abs(line.y - existingY) <= 3.5) {
        matchedY = existingY;
        break;
      }
    }
    if (matchedY >= 0) {
      yRows.get(matchedY)!.push(line);
    } else {
      yRows.set(line.y, [line]);
    }
  });

  const rowEntries = Array.from(yRows.entries()).sort((a, b) => b[0] - a[0]); // top to bottom
  const multiCellRows: string[][] = [];

  for (let i = 0; i < rowEntries.length; i++) {
    const rowLines = rowEntries[i][1].sort((a, b) => a.x - b.x);
    // Data table cells are concise values; long paragraph lines are multi-column paragraphs
    const hasLongParagraphs = rowLines.some((l) => l.text.length > 40 || l.width > 160);
    if (hasLongParagraphs) {
      if (multiCellRows.length >= 2) break;
      continue;
    }
    if (rowLines.length >= 2) {
      multiCellRows.push(rowLines.map((l) => l.text.trim()));
    } else if (multiCellRows.length >= 2) {
      break;
    }
  }

  if (multiCellRows.length >= 2) {
    const maxCols = Math.max(...multiCellRows.map((r) => r.length));
    const normalizedRows = multiCellRows.map((r) => {
      while (r.length < maxCols) r.push('');
      return r;
    });

    return {
      headers: normalizedRows[0],
      rows: normalizedRows.slice(1),
      minY: rowEntries[multiCellRows.length - 1]?.[0] || 0,
      maxY: rowEntries[0]?.[0] || 0,
    };
  }

  return null;
}

/**
 * High-Precision Multi-Column and Page Region Segmentation (Phase 11.1)
 * Eliminates false positives by strictly requiring persistent vertical overlap,
 * minimum line density (>= 4 per column), distinct horizontal gutters, and low full-width line ratios.
 */
export function segmentPageIntoRegions(lines: PdfLine[], fallbackPageWidth: number = 600): PdfRegion[] {
  if (lines.length === 0) return [];

  // 1. If the page contains a table structure, treat as full-width table region
  const tableCheck = detectTableFromLines(lines);
  if (tableCheck && tableCheck.rows.length >= 1) {
    return [
      {
        type: 'full-width',
        minY: lines[lines.length - 1]?.y || 0,
        maxY: lines[0]?.y || 0,
        lines,
      },
    ];
  }

  // 2. Derive dynamic page dimensions from actual content bounds
  const maxContentX = Math.max(...lines.map((l) => l.x + l.width));
  const minContentX = Math.min(...lines.map((l) => l.x));
  const effectivePageWidth = Math.max(fallbackPageWidth, maxContentX + 30);
  const columnMidpoint = (minContentX + effectivePageWidth) / 2;

  // 3. Classify lines into candidate buckets
  const leftCandidateLines: PdfLine[] = [];
  const rightCandidateLines: PdfLine[] = [];
  const fullWidthCandidateLines: PdfLine[] = [];

  lines.forEach((line) => {
    const isFullWidth = line.width >= (effectivePageWidth - minContentX) * 0.65;
    const isLeft = (line.x + line.width) <= columnMidpoint + 20 && line.x < columnMidpoint * 0.85;
    const isRight = line.x >= columnMidpoint - 20;

    if (isFullWidth) {
      fullWidthCandidateLines.push(line);
    } else if (isLeft) {
      leftCandidateLines.push(line);
    } else if (isRight) {
      rightCandidateLines.push(line);
    } else {
      fullWidthCandidateLines.push(line);
    }
  });

  // 4. Strict Multi-Column Qualification Rules:
  // Rule A: Minimum line count on BOTH columns (at least 4 lines on left and 4 lines on right)
  const hasSufficientLines = leftCandidateLines.length >= 4 && rightCandidateLines.length >= 4;

  // Rule B: Full-width dominance rule (if full-width lines exceed 60% of total lines, it's a single-column page)
  const isDominatedByFullWidth = fullWidthCandidateLines.length > (lines.length * 0.6);

  if (!hasSufficientLines || isDominatedByFullWidth) {
    return [
      {
        type: 'full-width',
        minY: lines[lines.length - 1]?.y || 0,
        maxY: lines[0]?.y || 0,
        lines,
      },
    ];
  }

  // Rule C: Vertical Overlap Requirement (both columns must span the same vertical region with >= 60px overlap)
  const leftMinY = Math.min(...leftCandidateLines.map((l) => l.y));
  const leftMaxY = Math.max(...leftCandidateLines.map((l) => l.y));
  const rightMinY = Math.min(...rightCandidateLines.map((l) => l.y));
  const rightMaxY = Math.max(...rightCandidateLines.map((l) => l.y));

  const verticalOverlap = Math.min(leftMaxY, rightMaxY) - Math.max(leftMinY, rightMinY);
  if (verticalOverlap < 60) {
    // Insufficient vertical coexistence: treat as single column
    return [
      {
        type: 'full-width',
        minY: lines[lines.length - 1]?.y || 0,
        maxY: lines[0]?.y || 0,
        lines,
      },
    ];
  }

  // Rule D: Distinct Horizontal Gutter (clear corridor between left column maxX and right column minX)
  const leftMaxX = Math.max(...leftCandidateLines.map((l) => l.x + l.width));
  const rightMinX = Math.min(...rightCandidateLines.map((l) => l.x));
  if (rightMinX - leftMaxX < 10) {
    // Columns touch or overlap horizontally without a gutter: treat as single column
    return [
      {
        type: 'full-width',
        minY: lines[lines.length - 1]?.y || 0,
        maxY: lines[0]?.y || 0,
        lines,
      },
    ];
  }

  // 5. Build Genuine Multi-Column Region and Surrounding Full-Width Regions
  const regions: PdfRegion[] = [];

  // Separate top full-width lines (above column region)
  const columnRegionMaxY = Math.max(leftMaxY, rightMaxY);
  const columnRegionMinY = Math.min(leftMinY, rightMinY);

  const topFullWidth = fullWidthCandidateLines.filter((l) => l.y > columnRegionMaxY + 10).sort((a, b) => b.y - a.y);
  const bottomFullWidth = fullWidthCandidateLines.filter((l) => l.y < columnRegionMinY - 10).sort((a, b) => b.y - a.y);

  if (topFullWidth.length > 0) {
    regions.push({
      type: 'full-width',
      minY: topFullWidth[topFullWidth.length - 1]?.y || 0,
      maxY: topFullWidth[0]?.y || 0,
      lines: topFullWidth,
    });
  }

  // Multi-column section
  leftCandidateLines.sort((a, b) => b.y - a.y);
  rightCandidateLines.sort((a, b) => b.y - a.y);

  const colLeft: PdfColumn = {
    index: 0,
    minX: minContentX,
    maxX: leftMaxX,
    lines: leftCandidateLines,
  };

  const colRight: PdfColumn = {
    index: 1,
    minX: rightMinX,
    maxX: maxContentX,
    lines: rightCandidateLines,
  };

  regions.push({
    type: 'multi-column',
    minY: columnRegionMinY,
    maxY: columnRegionMaxY,
    lines: [...leftCandidateLines, ...rightCandidateLines],
    columns: [colLeft, colRight],
  });

  if (bottomFullWidth.length > 0) {
    regions.push({
      type: 'full-width',
      minY: bottomFullWidth[bottomFullWidth.length - 1]?.y || 0,
      maxY: bottomFullWidth[0]?.y || 0,
      lines: bottomFullWidth,
    });
  }

  return regions;
}
