import { describe, it, expect } from 'vitest';
import { extractDocxContent } from '../src/lib/import/docxImporter';

describe('DOCX Importer (Phase 12)', () => {
  it('rejects oversized DOCX files (> 25MB)', async () => {
    const largeFile = new File(['mock content'], 'huge_report.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    Object.defineProperty(largeFile, 'size', { value: 30 * 1024 * 1024 });

    const result = await extractDocxContent(largeFile, 'huge_report.docx');
    expect(result.success).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('handles invalid / corrupted DOCX gracefully with actionable user error', async () => {
    const invalidFile = new File(['not a valid zip/docx'], 'corrupt.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const result = await extractDocxContent(invalidFile, 'corrupt.docx');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
