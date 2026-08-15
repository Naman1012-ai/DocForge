import { describe, it, expect } from 'vitest';

describe('File Upload Security & Input Validation', () => {
  const isAllowedExtension = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return (
      lower.endsWith('.md') ||
      lower.endsWith('.markdown') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.pdf') ||
      lower.endsWith('.docx') ||
      lower.endsWith('.html') ||
      lower.endsWith('.htm')
    );
  };

  const sanitizeUploadedFilenameTitle = (filename: string): string => {
    const baseFilename = filename.replace(/^.*[\\/]/, '');
    const rawBaseName = baseFilename.replace(/\.[^/.]+$/, '').replace(/[/\\:*?"<>|]/g, '');
    return rawBaseName
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Imported Document';
  };

  it('allows safe .md, .markdown, .txt, .pdf, .docx, and .html extensions', () => {
    expect(isAllowedExtension('report.md')).toBe(true);
    expect(isAllowedExtension('notes.markdown')).toBe(true);
    expect(isAllowedExtension('document.txt')).toBe(true);
    expect(isAllowedExtension('whitepaper.pdf')).toBe(true);
    expect(isAllowedExtension('REPORT.PDF')).toBe(true);
    expect(isAllowedExtension('proposal.docx')).toBe(true);
    expect(isAllowedExtension('page.html')).toBe(true);
    expect(isAllowedExtension('DOCUMENT.HTM')).toBe(true);
  });

  it('rejects unsafe executable and script extensions', () => {
    expect(isAllowedExtension('exploit.exe')).toBe(false);
    expect(isAllowedExtension('script.sh')).toBe(false);
    expect(isAllowedExtension('app.js')).toBe(false);
    expect(isAllowedExtension('payload.php')).toBe(false);
    expect(isAllowedExtension('runner.vbs')).toBe(false);
  });

  it('sanitizes path traversal filenames to prevent path injection in title', () => {
    expect(sanitizeUploadedFilenameTitle('../../etc/passwd.md')).toBe('Passwd');
    expect(sanitizeUploadedFilenameTitle('..\\..\\Windows\\System32\\config.txt')).toBe('Config');
    expect(sanitizeUploadedFilenameTitle('/var/log/system-incident-report.md')).toBe('System Incident Report');
  });
});
