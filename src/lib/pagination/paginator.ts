import type { PageSettings } from '../../models/settings';
import type { ThemeConfig } from '../../models/theme';

export interface PageDimensionInfo {
  pageWidthMm: number;
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  usableHeightPx: number;
  usableWidthPx: number;
}

const MM_TO_PX = 3.7795275591; // 96 DPI standard (96 / 25.4)

/**
 * Calculates physical page dimensions and usable content area in millimeters and pixels
 */
export function calculatePageDimensions(settings: PageSettings): PageDimensionInfo {
  const isLetter = settings.format === 'letter';
  const isLegal = settings.format === 'legal';
  const isLandscape = settings.orientation === 'landscape';

  let pageWidthMm = isLetter ? 215.9 : isLegal ? 215.9 : 210.0;
  let pageHeightMm = isLetter ? 279.4 : isLegal ? 355.6 : 297.0;

  if (isLandscape) {
    const temp = pageWidthMm;
    pageWidthMm = pageHeightMm;
    pageHeightMm = temp;
  }

  let marginTopMm = 25.0; // standard
  let marginBottomMm = 25.0;
  let marginLeftMm = 25.0;
  let marginRightMm = 25.0;

  if (settings.margins === 'compact') {
    marginTopMm = 15.0;
    marginBottomMm = 15.0;
    marginLeftMm = 15.0;
    marginRightMm = 15.0;
  } else if (settings.margins === 'relaxed') {
    marginTopMm = 35.0;
    marginBottomMm = 35.0;
    marginLeftMm = 35.0;
    marginRightMm = 35.0;
  } else if (settings.margins === 'custom' && settings.customMargins) {
    marginTopMm = Math.max(8, Math.min(50, settings.customMargins.top ?? 25));
    marginBottomMm = Math.max(8, Math.min(50, settings.customMargins.bottom ?? 25));
    marginLeftMm = Math.max(8, Math.min(50, settings.customMargins.left ?? 25));
    marginRightMm = Math.max(8, Math.min(50, settings.customMargins.right ?? 25));
  }

  // Header & Footer reserve space in mm
  const headerReserveMm = settings.showHeader ? 10.0 : 0.0;
  const footerReserveMm = settings.showFooter || settings.showPageNumbers ? 10.0 : 0.0;

  const usableHeightMm = Math.max(50, pageHeightMm - marginTopMm - marginBottomMm - headerReserveMm - footerReserveMm);
  const usableWidthMm = Math.max(50, pageWidthMm - marginLeftMm - marginRightMm);

  return {
    pageWidthMm,
    pageHeightMm,
    marginTopMm,
    marginBottomMm,
    marginLeftMm,
    marginRightMm,
    usableHeightPx: Math.floor(usableHeightMm * MM_TO_PX),
    usableWidthPx: Math.floor(usableWidthMm * MM_TO_PX),
  };
}

/**
 * Splits raw HTML into top-level block HTML strings
 */
export function splitHtmlIntoBlocks(html: string): string[] {
  if (!html || html.trim().length === 0) {
    return [];
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    const matches = html.match(/<(h[1-6]|p|div|blockquote|pre|table|ul|ol|hr)[^>]*>[\s\S]*?<\/\1>|<hr[^>]*\/?>/gi);
    return matches && matches.length > 0 ? matches : [html];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
    const blocks: string[] = [];

    Array.from(doc.body.children).forEach((child) => {
      blocks.push(child.outerHTML);
    });

    if (blocks.length === 0 && doc.body.innerHTML.trim().length > 0) {
      blocks.push(`<p>${doc.body.innerHTML}</p>`);
    }

    return blocks;
  } catch (e) {
    console.warn('DOMParser failed, falling back to raw html:', e);
    return [html];
  }
}

/**
 * Accurately measures the rendered pixel height of an HTML block
 */
function measureBlockHeight(
  blockHtml: string,
  usableWidthPx: number,
  theme: ThemeConfig,
  measurementSandbox?: HTMLElement | null
): number {
  // 1. In-browser direct DOM measurement
  if (measurementSandbox && typeof window !== 'undefined') {
    measurementSandbox.innerHTML = blockHtml;
    const firstElem = measurementSandbox.firstElementChild as HTMLElement | null;
    let computedHeight = measurementSandbox.offsetHeight;

    if (firstElem && typeof window.getComputedStyle !== 'undefined') {
      const styles = window.getComputedStyle(firstElem);
      const marginTop = parseFloat(styles.marginTop) || 0;
      const marginBottom = parseFloat(styles.marginBottom) || 0;
      computedHeight = firstElem.offsetHeight + marginTop + marginBottom;
    }

    measurementSandbox.innerHTML = '';
    if (computedHeight > 0) {
      return Math.ceil(computedHeight);
    }
  }

  // 2. Deterministic mathematical model for Node / Vitest
  const cleanText = blockHtml.replace(/<[^>]*>/g, '');
  const charCount = cleanText.length;

  let baseLineHeightPx = 22;
  if (theme.bodyFontSize === '9.5pt') baseLineHeightPx = 18;
  if (theme.bodyFontSize === '11.5pt') baseLineHeightPx = 25;

  if (/^<h1/i.test(blockHtml)) return 50;
  if (/^<h2/i.test(blockHtml)) return 38;
  if (/^<h3/i.test(blockHtml)) return 30;
  if (/^<h[4-6]/i.test(blockHtml)) return 26;
  if (/^<hr/i.test(blockHtml)) return 20;

  if (/^<pre/i.test(blockHtml)) {
    const lines = (blockHtml.match(/\n/g) || []).length + 1;
    return Math.max(40, lines * 18 + 24);
  }

  if (/^<table/i.test(blockHtml)) {
    const rowCount = (blockHtml.match(/<tr/gi) || []).length;
    return Math.max(45, rowCount * 28 + 20);
  }

  if (/^<blockquote/i.test(blockHtml)) {
    const charsPerLine = Math.max(45, Math.floor(usableWidthPx / 7.5));
    const lines = Math.max(1, Math.ceil(charCount / charsPerLine));
    return lines * baseLineHeightPx + 20;
  }

  if (/^<(ul|ol)/i.test(blockHtml)) {
    const itemCount = (blockHtml.match(/<li/gi) || []).length;
    return Math.max(25, itemCount * (baseLineHeightPx + 4) + 12);
  }

  // Standard Paragraph / Dialogue
  const charsPerLine = Math.max(50, Math.floor(usableWidthPx / 7.2));
  const estimatedLines = Math.max(1, Math.ceil(charCount / charsPerLine));
  return Math.ceil(estimatedLines * baseLineHeightPx + 10);
}

/**
 * Splits a long paragraph HTML block into two pieces to fit available vertical space
 */
function splitParagraphBlock(
  paragraphHtml: string,
  availableHeightPx: number,
  usableWidthPx: number,
  theme: ThemeConfig,
  sandbox?: HTMLElement | null
): { firstPart: string; secondPart: string } | null {
  // Only attempt to split if it's a standard <p> element
  if (!/^<p[^>]*>/i.test(paragraphHtml)) {
    return null;
  }

  const innerContent = paragraphHtml.replace(/^<p[^>]*>|<\/p>$/gi, '');
  // Split content by sentences or spaces
  const words = innerContent.split(' ');
  if (words.length < 8) {
    return null;
  }

  let low = 1;
  let high = words.length - 1;
  let bestSplit = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = `<p>${words.slice(0, mid).join(' ')}</p>`;
    const candidateHeight = measureBlockHeight(candidate, usableWidthPx, theme, sandbox);

    if (candidateHeight <= availableHeightPx - 10) {
      bestSplit = mid;
      low = mid + 1; // Try to fit more
    } else {
      high = mid - 1;
    }
  }

  if (bestSplit > 3 && bestSplit < words.length - 2) {
    const firstPart = `<p>${words.slice(0, bestSplit).join(' ')}</p>`;
    const secondPart = `<p>${words.slice(bestSplit).join(' ')}</p>`;
    return { firstPart, secondPart };
  }

  return null;
}

/**
 * Paginates an HTML document into discrete, high-fidelity physical page sheets
 * balancing content integrity (no clipping) with high page utilization (no excessive whitespace).
 */
export function paginateDocumentHtml(
  rawHtml: string,
  settings: PageSettings,
  theme: ThemeConfig
): string[] {
  if (!rawHtml || rawHtml.trim().length === 0) {
    return [''];
  }

  const dimensions = calculatePageDimensions(settings);
  const blocks = splitHtmlIntoBlocks(rawHtml);

  if (blocks.length === 0) {
    return [''];
  }

  // Setup DOM measurement sandbox if available in browser
  let sandbox: HTMLElement | null = null;
  if (typeof document !== 'undefined' && document.body) {
    sandbox = document.getElementById('docforge-measure-sandbox');
    if (!sandbox) {
      sandbox = document.createElement('div');
      sandbox.id = 'docforge-measure-sandbox';
      sandbox.style.position = 'absolute';
      sandbox.style.visibility = 'hidden';
      sandbox.style.top = '-99999px';
      sandbox.style.left = '-99999px';
      sandbox.style.pointerEvents = 'none';
      sandbox.className = `docforge-content docforge-theme-${theme.id}`;
      document.body.appendChild(sandbox);
    }
    sandbox.style.width = `${dimensions.usableWidthPx}px`;
    sandbox.style.fontSize = theme.bodyFontSize;
    sandbox.style.lineHeight = String(theme.bodyLineHeight);
  }

  const pages: string[] = [];
  let currentPageBlocks: string[] = [];
  let currentHeightPx = 0;
  const maxUsableHeight = dimensions.usableHeightPx;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Explicit Page Break Check
    const isPageBreak = /\b(page-break|docforge-page-break)\b/i.test(block);
    if (isPageBreak && currentPageBlocks.length > 0) {
      pages.push(currentPageBlocks.join('\n'));
      currentPageBlocks = [];
      currentHeightPx = 0;
      continue;
    }

    const blockHeight = measureBlockHeight(block, dimensions.usableWidthPx, theme, sandbox);
    const isHeading = /^<h[1-3]/i.test(block);

    // 1. Heading Orphan Prevention:
    // A heading must have room for itself + at least 1-2 lines of text (~30px)
    const headingOrphanThreshold = blockHeight + 30;
    if (isHeading && currentHeightPx + headingOrphanThreshold > maxUsableHeight && currentPageBlocks.length > 0) {
      pages.push(currentPageBlocks.join('\n'));
      currentPageBlocks = [block];
      currentHeightPx = blockHeight;
      continue;
    }

    // 2. Block fits comfortably on current page
    if (currentHeightPx + blockHeight <= maxUsableHeight) {
      currentPageBlocks.push(block);
      currentHeightPx += blockHeight;
      continue;
    }

    // 3. Block overflows remaining space on current page
    const remainingSpace = maxUsableHeight - currentHeightPx;

    // Check if long paragraph can split across the boundary to utilize remaining space
    if (remainingSpace >= 45 && /^<p/i.test(block)) {
      const splitResult = splitParagraphBlock(block, remainingSpace, dimensions.usableWidthPx, theme, sandbox);
      if (splitResult) {
        currentPageBlocks.push(splitResult.firstPart);
        pages.push(currentPageBlocks.join('\n'));

        // Start new page with continuation part
        currentPageBlocks = [splitResult.secondPart];
        currentHeightPx = measureBlockHeight(splitResult.secondPart, dimensions.usableWidthPx, theme, sandbox);
        continue;
      }
    }

    // If block didn't split or wasn't splittable, move to new page
    if (currentPageBlocks.length > 0) {
      pages.push(currentPageBlocks.join('\n'));
      currentPageBlocks = [block];
      currentHeightPx = blockHeight;
    } else {
      // If even a fresh page cannot fit this huge single block (e.g. gigantic table or code block)
      currentPageBlocks.push(block);
      currentHeightPx = blockHeight;
    }
  }

  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks.join('\n'));
  }

  return pages.length > 0 ? pages : [''];
}
