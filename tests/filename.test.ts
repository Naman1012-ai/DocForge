import { describe, it, expect } from 'vitest';
import { generatePdfFilename } from '../src/utils/filename';

describe('Filename Utility & Sanitization', () => {
  it('generates a clean sanitized .pdf filename from title', () => {
    expect(generatePdfFilename('Quarterly Architecture Report')).toBe('quarterly-architecture-report.pdf');
  });

  it('strips invalid filesystem characters and symbols', () => {
    const dirty = 'Doc / Title: With * Question? and "Quotes" <Tags> | Pipe';
    const sanitized = generatePdfFilename(dirty);
    expect(sanitized).toBe('doc-title-with-question-and-quotes-tags-pipe.pdf');
  });

  it('avoids duplicate .pdf.pdf extension', () => {
    expect(generatePdfFilename('my-document.pdf')).toBe('my-document.pdf');
    expect(generatePdfFilename('report.PDF')).toBe('report.pdf');
  });

  it('handles empty or whitespace-only titles by falling back to default', () => {
    expect(generatePdfFilename('')).toBe('docforge-document.pdf');
    expect(generatePdfFilename('   ')).toBe('docforge-document.pdf');
    expect(generatePdfFilename('...')).toBe('docforge-document.pdf');
  });

  it('truncates excessively long titles to 80 chars max', () => {
    const longTitle = 'a'.repeat(120);
    const result = generatePdfFilename(longTitle);
    expect(result.length).toBeLessThanOrEqual(84); // 80 chars + .pdf
    expect(result.endsWith('.pdf')).toBe(true);
  });
});
