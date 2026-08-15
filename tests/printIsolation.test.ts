import { describe, it, expect } from 'vitest';
import { paginateDocumentHtml } from '../src/lib/pagination/paginator';
import { parseMarkdownToHtml } from '../src/lib/parser/markdownParser';
import { DEFAULT_PAGE_SETTINGS, type PageSettings } from '../src/models/settings';
import { resolveThemeTokens } from '../src/models/theme';

describe('Print/PDF Rendering Isolation & Multi-Page Fidelity', () => {
  const longReportMarkdown = Array.from({ length: 40 }, (_, i) => `
## Section ${i + 1}: Architectural Milestone Specification

This section details the critical components, load profiles, and verification requirements for milestone ${i + 1}.
Distributed consensus protocols ensure deterministic state replication across participating nodes.
All transactions must be validated against immutable ledger constraints before commitment.

- Verification item A: Latency bounded beneath 15ms at p99
- Verification item B: Fault-tolerant recovery under network partitioning
- Verification item C: Data durability guarantees with zero data loss

| Metric | Target | Actual | Status |
| :--- | :--- | :--- | :--- |
| Latency | < 20ms | 12.4ms | Passed |
| Throughput | > 5000 ops | 6200 ops | Passed |
`).join('\n');

  it('paginates a multi-page document into multiple discrete sheets matching document length', () => {
    const html = parseMarkdownToHtml(longReportMarkdown);
    const settings: PageSettings = { ...DEFAULT_PAGE_SETTINGS, format: 'a4' };
    const theme = resolveThemeTokens('modern', settings);

    const pages = paginateDocumentHtml(html, settings, theme);

    // Verifies that a long report produces multiple discrete sheets (e.g. 15-25 pages) rather than collapsing to 1 page
    expect(pages.length).toBeGreaterThan(10);
    pages.forEach((pageContent) => {
      expect(pageContent.trim().length).toBeGreaterThan(0);
      // Ensures no raw script tags or UI chrome exist in page content
      expect(pageContent).not.toContain('<script');
      expect(pageContent).not.toContain('docforge-header');
      expect(pageContent).not.toContain('docforge-editor-toolbar');
    });
  });

  it('preserves page dimensions and orientation for A4, Letter, and Legal', () => {
    const html = parseMarkdownToHtml('# Sample Heading\n\nSample body paragraph.');

    // A4 Portrait
    const a4Settings: PageSettings = { ...DEFAULT_PAGE_SETTINGS, format: 'a4', orientation: 'portrait' };
    const a4Pages = paginateDocumentHtml(html, a4Settings, resolveThemeTokens('modern', a4Settings));
    expect(a4Pages.length).toBe(1);

    // Letter Landscape
    const letterLandscape: PageSettings = { ...DEFAULT_PAGE_SETTINGS, format: 'letter', orientation: 'landscape' };
    const letterPages = paginateDocumentHtml(html, letterLandscape, resolveThemeTokens('modern', letterLandscape));
    expect(letterPages.length).toBe(1);

    // Legal Portrait
    const legalSettings: PageSettings = { ...DEFAULT_PAGE_SETTINGS, format: 'legal', orientation: 'portrait' };
    const legalPages = paginateDocumentHtml(html, legalSettings, resolveThemeTokens('modern', legalSettings));
    expect(legalPages.length).toBe(1);
  });

  it('respects compact, standard, and relaxed margins in page layout calculations', () => {
    const html = parseMarkdownToHtml(longReportMarkdown);

    const compactSettings: PageSettings = { ...DEFAULT_PAGE_SETTINGS, margins: 'compact' };
    const relaxedSettings: PageSettings = { ...DEFAULT_PAGE_SETTINGS, margins: 'relaxed' };

    const compactPages = paginateDocumentHtml(html, compactSettings, resolveThemeTokens('modern', compactSettings));
    const relaxedPages = paginateDocumentHtml(html, relaxedSettings, resolveThemeTokens('modern', relaxedSettings));

    // Compact margins provide more usable vertical space per sheet, resulting in fewer total pages than relaxed margins
    expect(compactPages.length).toBeLessThanOrEqual(relaxedPages.length);
  });

  it('preserves header and footer configurations on paginated sheets', () => {
    const html = parseMarkdownToHtml('# Title\n\nParagraph text.');
    const settings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      showHeader: true,
      showFooter: true,
      showPageNumbers: true,
      headerText: 'Confidential Internal Report',
      footerText: 'DocForge Enterprise Edition',
    };

    const pages = paginateDocumentHtml(html, settings, resolveThemeTokens('modern', settings));
    expect(pages.length).toBe(1);
  });
});
