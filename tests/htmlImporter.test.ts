import { describe, it, expect } from 'vitest';
import { parseHtmlToMarkdown } from '../src/lib/import/htmlImporter';

describe('HTML Importer & Sanitization Pipeline (Phase 12)', () => {
  it('converts semantic headings, paragraphs, and inline formatting to clean Markdown', () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>System Architecture Guide</title></head>
        <body>
          <h1>System Architecture Guide</h1>
          <p>This is an <strong>important</strong> introduction with <em>italicized</em> details and <code>inline code</code>.</p>
          <h2>Core Principles</h2>
          <p>Here is a second paragraph with a <del>deprecated</del> reference and a <a href="https://example.com/docs">documentation link</a>.</p>
          <hr/>
        </body>
      </html>
    `;

    const result = parseHtmlToMarkdown(rawHtml, 'architecture.html');
    expect(result.success).toBe(true);
    expect(result.title).toBe('System Architecture Guide');
    expect(result.markdownContent).toContain('# System Architecture Guide');
    expect(result.markdownContent).toContain('**important**');
    expect(result.markdownContent).toContain('*italicized*');
    expect(result.markdownContent).toContain('`inline code`');
    expect(result.markdownContent).toContain('## Core Principles');
    expect(result.markdownContent).toContain('~~deprecated~~');
    expect(result.markdownContent).toContain('[documentation link](https://example.com/docs)');
    expect(result.markdownContent).toContain('---');
  });

  it('converts unordered and ordered nested lists', () => {
    const listHtml = `
      <ul>
        <li>First main point</li>
        <li>Second main point
          <ul>
            <li>Sub-point A</li>
            <li>Sub-point B</li>
          </ul>
        </li>
      </ul>
      <ol>
        <li>Step one</li>
        <li>Step two</li>
      </ol>
    `;

    const result = parseHtmlToMarkdown(listHtml, 'lists.html');
    expect(result.success).toBe(true);
    expect(result.markdownContent).toContain('- First main point');
    expect(result.markdownContent).toContain('Step one');
  });

  it('converts HTML tables into Markdown tables', () => {
    const tableHtml = `
      <table>
        <thead>
          <tr><th>Benchmark</th><th>P50 Latency</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Pipeline Parse</td><td>4.2 ms</td><td>Passed</td></tr>
          <tr><td>PDF Render</td><td>12.8 ms</td><td>Passed</td></tr>
        </tbody>
      </table>
    `;

    const result = parseHtmlToMarkdown(tableHtml, 'benchmark.html');
    expect(result.success).toBe(true);
    expect(result.markdownContent).toContain('Benchmark | P50 Latency | Status');
    expect(result.markdownContent).toContain('Pipeline Parse | 4.2 ms | Passed');
  });

  it('strictly sanitizes XSS script tags, iframes, and javascript: URLs', () => {
    const maliciousHtml = `
      <h1>Safe Title</h1>
      <script>alert('xss');</script>
      <iframe src="https://attacker.com/evil"></iframe>
      <p>Click <a href="javascript:alert('pwned')">here</a> for details.</p>
      <img src="x" onerror="alert(1)" alt="test"/>
    `;

    const result = parseHtmlToMarkdown(maliciousHtml, 'payload.html');
    expect(result.success).toBe(true);
    expect(result.markdownContent).not.toContain('<script>');
    expect(result.markdownContent).not.toContain('alert(');
    expect(result.markdownContent).not.toContain('<iframe>');
    expect(result.markdownContent).not.toContain('javascript:');
    expect(result.markdownContent).toContain('# Safe Title');
  });

  it('handles empty and whitespace-only HTML gracefully', () => {
    const result = parseHtmlToMarkdown('   ', 'empty.html');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
