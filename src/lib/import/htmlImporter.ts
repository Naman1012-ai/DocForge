/**
 * DocFrame Phase 12 — Semantic HTML Importer & Sanitization Pipeline
 */

export interface ImportedHtmlResult {
  success: boolean;
  title: string;
  markdownContent: string;
  warnings: string[];
  summary: {
    headingCount: number;
    paragraphCount: number;
    listCount: number;
    tableCount: number;
    linkCount: number;
  };
  error?: string;
}

const DANGEROUS_TAGS = new Set([
  'SCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'STYLE',
  'LINK',
  'META',
  'FORM',
  'INPUT',
  'BUTTON',
  'SVG',
  'CANVAS',
  'APPLET',
]);

const DANGEROUS_SCHEMES = /^(\s*javascript:|\s*data:(?!image\/)|\s*vbscript:)/i;

/**
 * Sanitizes a URL, blocking javascript: and dangerous URI schemes
 */
function sanitizeUrl(url: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (DANGEROUS_SCHEMES.test(trimmed)) {
    return '#';
  }
  return trimmed;
}

/**
 * Converts a DOM node recursively into structured Markdown
 */
function domNodeToMarkdown(
  node: Node,
  state: {
    headingCount: number;
    paragraphCount: number;
    listCount: number;
    tableCount: number;
    linkCount: number;
    warnings: string[];
  },
  listDepth: number = 0
): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    // Normalize excessive inline whitespace
    return text.replace(/\s+/g, ' ');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tagName = el.tagName.toUpperCase();

  // Strip dangerous elements
  if (DANGEROUS_TAGS.has(tagName)) {
    return '';
  }

  // Process children
  const getChildrenMarkdown = (customDepth: number = listDepth): string => {
    let result = '';
    for (let i = 0; i < el.childNodes.length; i++) {
      result += domNodeToMarkdown(el.childNodes[i], state, customDepth);
    }
    return result;
  };

  // Headings
  if (/^H[1-6]$/.test(tagName)) {
    state.headingCount++;
    const level = parseInt(tagName.charAt(1), 10);
    const hashes = '#'.repeat(level);
    const innerText = getChildrenMarkdown().trim();
    return innerText.length > 0 ? `\n\n${hashes} ${innerText}\n\n` : '';
  }

  // Paragraphs
  if (tagName === 'P') {
    state.paragraphCount++;
    const innerText = getChildrenMarkdown().trim();
    return innerText.length > 0 ? `\n\n${innerText}\n\n` : '';
  }

  // Blockquotes
  if (tagName === 'BLOCKQUOTE') {
    state.paragraphCount++;
    const innerText = getChildrenMarkdown().trim();
    const quotedLines = innerText
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
    return `\n\n${quotedLines}\n\n`;
  }

  // Preformatted Code
  if (tagName === 'PRE') {
    const codeEl = el.querySelector('code');
    const codeText = codeEl ? codeEl.textContent || '' : el.textContent || '';
    return `\n\n\`\`\`\n${codeText.trim()}\n\`\`\`\n\n`;
  }

  // Inline Code
  if (tagName === 'CODE') {
    const codeText = el.textContent || '';
    return `\`${codeText.replace(/`/g, '\\`')}\``;
  }

  // Emphasis / Formatting
  if (tagName === 'STRONG' || tagName === 'B') {
    const inner = getChildrenMarkdown().trim();
    return inner.length > 0 ? `**${inner}**` : '';
  }

  if (tagName === 'EM' || tagName === 'I') {
    const inner = getChildrenMarkdown().trim();
    return inner.length > 0 ? `*${inner}*` : '';
  }

  if (tagName === 'DEL' || tagName === 'S' || tagName === 'STRIKE') {
    const inner = getChildrenMarkdown().trim();
    return inner.length > 0 ? `~~${inner}~~` : '';
  }

  if (tagName === 'U') {
    const inner = getChildrenMarkdown().trim();
    return inner.length > 0 ? `<u>${inner}</u>` : '';
  }

  // Horizontal Rule
  if (tagName === 'HR') {
    return '\n\n---\n\n';
  }

  // Links
  if (tagName === 'A') {
    state.linkCount++;
    const href = sanitizeUrl(el.getAttribute('href'));
    const linkText = getChildrenMarkdown().trim() || 'Link';
    return `[${linkText}](${href})`;
  }

  // Images
  if (tagName === 'IMG') {
    const src = sanitizeUrl(el.getAttribute('src'));
    const alt = (el.getAttribute('alt') || 'Image').trim();
    if (src && !src.startsWith('#')) {
      return `![${alt}](${src})`;
    }
    return '';
  }

  // Unordered Lists
  if (tagName === 'UL') {
    state.listCount++;
    let listMd = '\n\n';
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child.tagName.toUpperCase() === 'LI') {
        const indent = '  '.repeat(listDepth);
        const itemText = domNodeToMarkdown(child, state, listDepth + 1).trim();
        if (itemText.length > 0) {
          listMd += `${indent}- ${itemText}\n`;
        }
      }
    }
    return listMd + '\n';
  }

  // Ordered Lists
  if (tagName === 'OL') {
    state.listCount++;
    let listMd = '\n\n';
    let orderIndex = 1;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child.tagName.toUpperCase() === 'LI') {
        const indent = '  '.repeat(listDepth);
        const itemText = domNodeToMarkdown(child, state, listDepth + 1).trim();
        if (itemText.length > 0) {
          listMd += `${indent}${orderIndex}. ${itemText}\n`;
          orderIndex++;
        }
      }
    }
    return listMd + '\n';
  }

  // List Item (fallback if outside UL/OL)
  if (tagName === 'LI') {
    return getChildrenMarkdown(listDepth);
  }

  // Tables
  if (tagName === 'TABLE') {
    state.tableCount++;
    const rows: string[][] = [];

    const trElements = el.querySelectorAll('tr');
    trElements.forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll('th, td').forEach((cell) => {
        const cellText = (cell.textContent || '').replace(/[\n\r|]/g, ' ').trim();
        cells.push(cellText);
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    if (rows.length >= 1) {
      const maxCols = Math.max(...rows.map((r) => r.length));
      const normalizedRows = rows.map((r) => {
        while (r.length < maxCols) r.push('');
        return r;
      });

      const headerRow = normalizedRows[0];
      const dataRows = normalizedRows.slice(1);

      const tableLines: string[] = [
        `| ${headerRow.join(' | ')} |`,
        `| ${headerRow.map(() => ':---').join(' | ')} |`,
      ];

      dataRows.forEach((r) => {
        tableLines.push(`| ${r.join(' | ')} |`);
      });

      return `\n\n${tableLines.join('\n')}\n\n`;
    }
    return '';
  }

  // Default container elements (div, section, article, main, span, body)
  return getChildrenMarkdown();
}

/**
 * Parses and sanitizes raw HTML string into clean DocFrame Markdown
 */
export function parseHtmlToMarkdown(rawHtml: string, originalFilename: string = 'Imported HTML Document'): ImportedHtmlResult {
  if (!rawHtml || rawHtml.trim().length === 0) {
    return {
      success: false,
      title: 'Empty HTML',
      markdownContent: '',
      warnings: ['The HTML document contains no content.'],
      summary: { headingCount: 0, paragraphCount: 0, listCount: 0, tableCount: 0, linkCount: 0 },
      error: 'The HTML document is empty.',
    };
  }

  try {
    let doc: Document;
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(rawHtml, 'text/html');
    } else {
      // Vitest / Node test environment fallback
      return parseHtmlWithBasicFallback(rawHtml, originalFilename);
    }

    // Extract title from <title> or first H1
    let extractedTitle = '';
    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 0) {
      extractedTitle = titleEl.textContent.trim();
    } else {
      const h1El = doc.querySelector('h1');
      if (h1El && h1El.textContent && h1El.textContent.trim().length > 0) {
        extractedTitle = h1El.textContent.trim();
      }
    }

    if (!extractedTitle) {
      const rawBaseName = originalFilename.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '').replace(/[/\\:*?"<>|]/g, '');
      extractedTitle = rawBaseName
        .replace(/[-_]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Imported HTML Document';
    }

    const state = {
      headingCount: 0,
      paragraphCount: 0,
      listCount: 0,
      tableCount: 0,
      linkCount: 0,
      warnings: [] as string[],
    };

    const targetRoot = doc.body || doc.documentElement;
    let markdown = domNodeToMarkdown(targetRoot, state).trim();

    // Clean up multiple consecutive newlines (max 2)
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    return {
      success: true,
      title: extractedTitle,
      markdownContent: markdown,
      warnings: state.warnings,
      summary: {
        headingCount: state.headingCount,
        paragraphCount: state.paragraphCount,
        listCount: state.listCount,
        tableCount: state.tableCount,
        linkCount: state.linkCount,
      },
    };
  } catch (err: unknown) {
    console.error('HTML Import Error:', err);
    return {
      success: false,
      title: 'Import Error',
      markdownContent: '',
      warnings: [],
      summary: { headingCount: 0, paragraphCount: 0, listCount: 0, tableCount: 0, linkCount: 0 },
      error: 'Failed to parse HTML document.',
    };
  }
}

/**
 * Basic regex-based parser for non-browser Node/test environments
 */
function parseHtmlWithBasicFallback(rawHtml: string, originalFilename: string): ImportedHtmlResult {
  // Extract title from <title> or first <h1>
  let extractedTitle = '';
  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1].trim().length > 0) {
    extractedTitle = titleMatch[1].trim();
  } else {
    const h1Match = rawHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match && h1Match[1].trim().length > 0) {
      extractedTitle = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }
  }

  if (!extractedTitle) {
    const rawBaseName = originalFilename.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '').replace(/[/\\:*?"<>|]/g, '');
    extractedTitle = rawBaseName
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Imported HTML Document';
  }

  // Strip dangerous scripts and styles
  let clean = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  let headingCount = 0;
  let paragraphCount = 0;
  let listCount = 0;
  let tableCount = 0;
  let linkCount = 0;

  // Tables
  clean = clean.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    tableCount++;
    const rows: string[][] = [];
    const trMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    trMatches.forEach((trHtml: string) => {
      const cells: string[] = [];
      const cellMatches = trHtml.match(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
      cellMatches.forEach((cellHtml: string) => {
        const cellText = cellHtml.replace(/<[^>]+>/g, '').replace(/[\n\r|]/g, ' ').trim();
        cells.push(cellText);
      });
      if (cells.length > 0) rows.push(cells);
    });

    if (rows.length >= 1) {
      const maxCols = Math.max(...rows.map((r) => r.length));
      const normalizedRows = rows.map((r) => {
        while (r.length < maxCols) r.push('');
        return r;
      });
      const headerRow = normalizedRows[0];
      const dataRows = normalizedRows.slice(1);
      const lines = [
        `| ${headerRow.join(' | ')} |`,
        `| ${headerRow.map(() => ':---').join(' | ')} |`,
        ...dataRows.map((r) => `| ${r.join(' | ')} |`),
      ];
      return `\n\n${lines.join('\n')}\n\n`;
    }
    return '';
  });

  // Headings
  clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => {
    headingCount++;
    return `\n\n# ${text.trim()}\n\n`;
  });
  clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => {
    headingCount++;
    return `\n\n## ${text.trim()}\n\n`;
  });
  clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => {
    headingCount++;
    return `\n\n### ${text.trim()}\n\n`;
  });

  // Paragraphs
  clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => {
    paragraphCount++;
    return `\n\n${text.trim()}\n\n`;
  });

  // Formatting
  clean = clean.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  clean = clean.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  clean = clean.replace(/<(s|del|strike)[^>]*>([\s\S]*?)<\/\1>/gi, '~~$2~~');
  clean = clean.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  clean = clean.replace(/<hr[^>]*\/?>/gi, '\n\n---\n\n');

  // Lists
  clean = clean.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => {
    listCount++;
    return `- ${text.trim()}\n`;
  });
  clean = clean.replace(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi, '\n\n$2\n\n');

  // Links
  clean = clean.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    linkCount++;
    return `[${text.trim()}](${sanitizeUrl(href)})`;
  });

  // Strip remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

  return {
    success: true,
    title: extractedTitle,
    markdownContent: clean,
    warnings: [],
    summary: { headingCount, paragraphCount, listCount, tableCount, linkCount },
  };
}
