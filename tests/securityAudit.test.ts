import { describe, it, expect } from 'vitest';
import { parseMarkdownToHtml } from '../src/lib/parser/markdownParser';

describe('Security & XSS Defense Audit', () => {
  it('neutralizes standard script tags', () => {
    const payload = '# Title\n<script>alert("XSS")</script>';
    const output = parseMarkdownToHtml(payload);
    expect(output).not.toContain('<script>');
    expect(output).not.toContain('alert("XSS")');
  });

  it('neutralizes inline event handlers across all elements', () => {
    const payload = `
<img src="valid.jpg" onerror="alert('xss')" onload="alert('xss')" />
<a href="#" onclick="alert('xss')">Link</a>
<div onmouseover="alert('xss')">Hover me</div>
<span onfocus="alert('xss')">Focus</span>
    `;
    const output = parseMarkdownToHtml(payload);
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('onload');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('onmouseover');
    expect(output).not.toContain('onfocus');
  });

  it('blocks dangerous URL protocols (javascript:, vbscript:, data:text/html)', () => {
    const payload = `
[Exploit 1](javascript:alert(1))
[Exploit 2](javascript://%0aalert(1))
[Exploit 3](vbscript:msgbox(1))
[Exploit 4](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)
    `;
    const output = parseMarkdownToHtml(payload);
    expect(output).not.toContain('href="javascript:');
    expect(output).not.toContain('href="vbscript:');
    expect(output).not.toContain('href="data:text/html');
  });

  it('blocks dangerous embedding tags (iframe, object, embed, applet, form)', () => {
    const payload = `
<iframe src="https://evil.com"></iframe>
<object data="malicious.swf"></object>
<embed src="malicious.pdf"></embed>
<form action="https://evil.com"><input type="text"/></form>
    `;
    const output = parseMarkdownToHtml(payload);
    expect(output).not.toContain('<iframe');
    expect(output).not.toContain('<object');
    expect(output).not.toContain('<embed');
    expect(output).not.toContain('<form');
  });

  it('neutralizes malicious SVG with embedded scripts', () => {
    const payload = '<svg><script>alert("SVG XSS")</script><circle cx="50" cy="50" r="40" /></svg>';
    const output = parseMarkdownToHtml(payload);
    expect(output).not.toContain('<script');
    expect(output).not.toContain('<svg');
  });
});
