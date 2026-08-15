import { describe, it, expect } from 'vitest';
import { parseMarkdownToHtml, normalizePlainTextToMarkdown } from '../src/lib/parser/markdownParser';

describe('Markdown Parser & Sanitization Pipeline', () => {
  it('parses basic headings and paragraphs into semantic HTML', () => {
    const input = '# Heading 1\n\nParagraph text.';
    const output = parseMarkdownToHtml(input);
    expect(output).toContain('<h1>Heading 1</h1>');
    expect(output).toContain('<p>Paragraph text.</p>');
  });

  it('supports GitHub Flavored Markdown tables and task lists', () => {
    const input = `
| Header 1 | Header 2 |
| :--- | :--- |
| Cell 1 | Cell 2 |

- [x] Task Done
- [ ] Task Pending
    `;
    const output = parseMarkdownToHtml(input);
    expect(output).toContain('<table>');
    expect(output).toContain('Header 1');
    expect(output).toContain('Cell 1');
    expect(output).toContain('type="checkbox"');
    expect(output).toContain('checked');
  });

  it('safely neutralizes malicious XSS script tags and event handlers', () => {
    const input = `
# Safe Title
<script>alert("XSS")</script>
<img src="bad" onerror="alert(1)" />
<a href="javascript:alert(1)">Exploit Link</a>
    `;
    const output = parseMarkdownToHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('javascript:');
  });

  it('normalizes plain text into markdown paragraphs', () => {
    const plain = 'First paragraph.\r\n\r\nSecond paragraph.';
    const normalized = normalizePlainTextToMarkdown(plain);
    expect(normalized).toBe('First paragraph.\n\nSecond paragraph.');
  });
});
