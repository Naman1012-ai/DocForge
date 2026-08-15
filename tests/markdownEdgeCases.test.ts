import { describe, it, expect } from 'vitest';
import { parseMarkdownToHtml, normalizePlainTextToMarkdown } from '../src/lib/parser/markdownParser';

describe('Markdown Parser Edge Cases & Stress Resilience', () => {
  it('handles empty and whitespace-only inputs without crashing', () => {
    expect(parseMarkdownToHtml('')).toBe('');
    expect(parseMarkdownToHtml('   \n\t  \n  ')).toBe('');
  });

  it('handles unmatched emphasis and unclosed tags gracefully', () => {
    const output = parseMarkdownToHtml('*unclosed italic and **unclosed bold');
    expect(output).toBeDefined();
    expect(typeof output).toBe('string');
  });

  it('handles empty links and empty images safely', () => {
    const output = parseMarkdownToHtml('Empty link []() and empty image ![]()');
    expect(output).toBeDefined();
    expect(typeof output).toBe('string');
  });

  it('handles diverse Unicode, Emojis, and Non-Latin scripts flawlessly', () => {
    const unicodeText = `# Global Multilingual Document 🌍 🚀
- English: Hello World!
- Hindi: नमस्ते दुनिया
- Japanese: こんにちは世界
- Arabic: مرحبا بالعالم
- Russian: Привет мир
- Greek: Γειά σου κόσμε
- Math Symbols: ∑ ∫ √ π ≠ ≈ ≤ ≥
`;
    const output = parseMarkdownToHtml(unicodeText);
    expect(output).toContain('Global Multilingual Document 🌍 🚀');
    expect(output).toContain('नमस्ते दुनिया');
    expect(output).toContain('こんにちは世界');
    expect(output).toContain('مرحبا بالعالم');
    expect(output).toContain('Привет мир');
    expect(output).toContain('Γειά σου κόσμε');
  });

  it('handles malformed tables with missing and extra cells', () => {
    const malformedTable = `
| Col A | Col B | Col C |
| :--- | :--- | :--- |
| Val 1 |
| Val 1 | Val 2 | Val 3 | Extra Val 4 |
| | | |
`;
    const output = parseMarkdownToHtml(malformedTable);
    expect(output).toContain('<table>');
    expect(output).toContain('Col A');
    expect(output).toContain('Val 1');
  });

  it('handles code blocks containing HTML tags and nested backticks safely', () => {
    const codeBlock = '```html\n<div class="test"><span>Inside Code</span></div>\n```';
    const output = parseMarkdownToHtml(codeBlock);
    expect(output).toContain('<pre>');
    expect(output).toContain('Inside Code');
    expect(output).not.toContain('<div class="test">'); // Raw div tag must be escaped/entity-encoded
  });

  it('handles deeply nested lists without stack overflow', () => {
    let listMd = '* Level 1\n';
    for (let i = 2; i <= 8; i++) {
      listMd += '  '.repeat(i - 1) + `* Level ${i}\n`;
    }
    const output = parseMarkdownToHtml(listMd);
    expect(output).toContain('Level 1');
    expect(output).toContain('Level 8');
  });

  it('handles very long paragraphs (1,000+ words)', () => {
    const longParagraph = 'word '.repeat(1000);
    const output = parseMarkdownToHtml(longParagraph);
    expect(output).toContain('<p>');
    expect(output.length).toBeGreaterThan(4000);
  });

  it('normalizes multi-line plain text with varying line endings', () => {
    const text = 'Line 1\r\n\r\nLine 2\r\rLine 3\n\nLine 4';
    const normalized = normalizePlainTextToMarkdown(text);
    expect(normalized).toBe('Line 1\n\nLine 2\n\nLine 3\n\nLine 4');
  });
});
