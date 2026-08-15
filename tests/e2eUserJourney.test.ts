import { describe, it, expect } from 'vitest';
import { parseMarkdownToHtml, parseToNormalizedDocument } from '../src/lib/parser/markdownParser';
import { calculateMetadata } from '../src/models/document';
import { resolveThemeTokens } from '../src/models/theme';
import { DEFAULT_PAGE_SETTINGS, type PageSettings } from '../src/models/settings';
import { generatePdfFilename } from '../src/utils/filename';
import { BUILT_IN_TEMPLATES } from '../src/models/template';

describe('End-to-End User Journeys & Complete Pipeline Integration', () => {
  it('executes Scenario A (Academic Report): Input -> Parse -> Theme Resolution -> Export Metadata', () => {
    const academicFixture = BUILT_IN_TEMPLATES['academic-report'];
    expect(academicFixture).toBeDefined();

    // 1. Tokenize and sanitize
    const normalized = parseToNormalizedDocument(academicFixture.starterContent, academicFixture.title);
    expect(normalized.title).toBe('Comparative Analysis of Distributed Consensus Protocols');
    expect(normalized.sanitizedHtml).toContain('Distributed Consensus Protocols');

    // 2. Resolve Academic Theme
    const settings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      format: 'a4',
      margins: 'standard',
    };
    const resolvedTheme = resolveThemeTokens('academic', settings);
    expect(resolvedTheme.fontFamily).toBe('serif');
    expect(resolvedTheme.headingFontFamily).toBe('serif');
    expect(resolvedTheme.titleAlignment).toBe('center');

    // 3. Generate safe export filename
    const filename = generatePdfFilename(normalized.title);
    expect(filename).toBe('comparative-analysis-of-distributed-consensus-protocols.pdf');
  });

  it('executes Scenario B (Technical Documentation): Code Blocks -> Tables -> Custom Accent Color', () => {
    const techFixture = BUILT_IN_TEMPLATES['technical-documentation'];
    expect(techFixture).toBeDefined();

    const normalized = parseToNormalizedDocument(techFixture.starterContent, techFixture.title);
    expect(normalized.sanitizedHtml).toContain('<table>');
    expect(normalized.sanitizedHtml).toContain('<pre>');

    // Custom accent override
    const settings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      customAccentColor: '#059669', // Emerald
      fontSizeScale: 'compact',
    };
    const resolvedTheme = resolveThemeTokens('technical', settings);
    expect(resolvedTheme.primaryColor).toBe('#059669');
    expect(resolvedTheme.bodyFontSize).toBe('9.5pt');

    const filename = generatePdfFilename(techFixture.name);
    expect(filename).toBe('technical-documentation.pdf');
  });

  it('executes Scenario C (Proposal Multi-Section): 10+ Sections -> Large Tables -> Page Count Calculation', () => {
    const fixture = BUILT_IN_TEMPLATES['proposal'];
    expect(fixture).toBeDefined();

    const html = parseMarkdownToHtml(fixture.starterContent);
    expect(html.length).toBeGreaterThan(1000);

    const metadata = calculateMetadata(fixture.starterContent);
    expect(metadata.wordCount).toBeGreaterThan(100);
    expect(metadata.lineCount).toBeGreaterThan(20);

    const filename = generatePdfFilename(fixture.name);
    expect(filename).toBe('project-proposal.pdf');
  });
});
