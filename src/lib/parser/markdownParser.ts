import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { NormalizedDocument } from '../../models/documentTree';

/**
 * Strict sanitization schema to prevent XSS while allowing standard document elements
 */
const docForgeSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'blockquote', 'ul', 'ol', 'li',
    'code', 'pre', 'em', 'strong', 'del',
    'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div', 'input',
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['className'],
    th: ['align'],
    td: ['align'],
    input: ['type', 'checked', 'disabled'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto', '#'],
    src: ['http', 'https', 'data'],
  },
};

/**
 * Synchronous / cached Markdown to sanitized HTML parser
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize, docForgeSanitizeSchema)
  .use(rehypeStringify);

/**
 * Parses raw Markdown text into safe, sanitized HTML
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown || markdown.trim().length === 0) {
    return '';
  }

  try {
    const file = processor.processSync(markdown);
    return String(file);
  } catch (error) {
    console.error('Markdown parsing error:', error);
    // Graceful fallback: return escaped text
    return `<p class="parse-error">${escapeHtml(markdown)}</p>`;
  }
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalizes plain text (.txt) into structured Markdown paragraphs
 */
export function normalizePlainTextToMarkdown(plainText: string): string {
  if (!plainText) return '';

  // Standardize line endings
  const normalized = plainText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double line breaks to form paragraphs, preserving single line breaks as markdown spaces
  const paragraphs = normalized.split(/\n\n+/);
  return paragraphs
    .map((para) => para.trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Parses Markdown into a NormalizedDocument representation for Phase 3
 */
export function parseToNormalizedDocument(markdown: string, documentTitle: string): NormalizedDocument {
  const sanitizedHtml = parseMarkdownToHtml(markdown);

  return {
    title: documentTitle,
    blocks: [], // Block AST extraction will be expanded in Phase 3
    sanitizedHtml,
  };
}
