import { describe, it, expect } from 'vitest';
import { exportDocumentToPdf } from '../src/lib/pdf/pdfExportService';
import { DEFAULT_PAGE_SETTINGS } from '../src/models/settings';
import { THEME_PRESETS } from '../src/models/theme';

describe('PDF Export Service Validation', () => {
  it('returns graceful error result when element is missing', async () => {
    const result = await exportDocumentToPdf({
      element: null,
      title: 'Test Document',
      settings: DEFAULT_PAGE_SETTINGS,
      theme: THEME_PRESETS.modern,
    });

    expect(result.success).toBe(false);
    expect(result.filename).toBe('test-document.pdf');
    expect(result.error).toContain('Document element not found');
  });

  it('resolves correct filename from customFilename option', async () => {
    const result = await exportDocumentToPdf({
      element: null,
      title: 'Original Title',
      customFilename: 'Custom Export Name',
      settings: DEFAULT_PAGE_SETTINGS,
      theme: THEME_PRESETS.modern,
    });

    expect(result.filename).toBe('custom-export-name.pdf');
  });
});
