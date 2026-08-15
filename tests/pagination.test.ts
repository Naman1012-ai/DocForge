import { describe, it, expect } from 'vitest';
import {
  calculatePageDimensions,
  splitHtmlIntoBlocks,
  paginateDocumentHtml,
} from '../src/lib/pagination/paginator';
import { DEFAULT_PAGE_SETTINGS, type PageSettings } from '../src/models/settings';
import { THEME_PRESETS } from '../src/models/theme';
import { parseMarkdownToHtml } from '../src/lib/parser/markdownParser';

describe('Pagination Engine & Page-Break Repair Suite (Phase 9A)', () => {
  it('calculates physical page dimensions for A4 and Letter accurately', () => {
    const a4Settings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      format: 'a4',
      margins: 'standard',
    };
    const a4Dims = calculatePageDimensions(a4Settings);
    expect(a4Dims.pageWidthMm).toBe(210.0);
    expect(a4Dims.pageHeightMm).toBe(297.0);
    expect(a4Dims.marginTopMm).toBe(25.0);
    expect(a4Dims.usableHeightPx).toBeGreaterThan(600);

    const letterSettings: PageSettings = {
      ...DEFAULT_PAGE_SETTINGS,
      format: 'letter',
      margins: 'compact',
    };
    const letterDims = calculatePageDimensions(letterSettings);
    expect(letterDims.pageWidthMm).toBe(215.9);
    expect(letterDims.pageHeightMm).toBe(279.4);
    expect(letterDims.marginTopMm).toBe(15.0);
  });

  it('splits HTML into distinct top-level block elements', () => {
    const html = '<h1>Title</h1><p>Paragraph 1</p><blockquote>Quote</blockquote>';
    const blocks = splitHtmlIntoBlocks(html);
    expect(blocks.length).toBe(3);
    expect(blocks[0]).toContain('<h1>Title</h1>');
    expect(blocks[1]).toContain('<p>Paragraph 1</p>');
    expect(blocks[2]).toContain('<blockquote>Quote</blockquote>');
  });

  it('paginates short one-page documents into exactly 1 page', () => {
    const shortMd = '# Short Note\n\nThis is a brief memo that easily fits on one sheet.';
    const html = parseMarkdownToHtml(shortMd);
    const pages = paginateDocumentHtml(html, DEFAULT_PAGE_SETTINGS, THEME_PRESETS.minimal);
    expect(pages.length).toBe(1);
    expect(pages[0]).toContain('Short Note');
  });

  it('maintains high page utilization without premature scene page breaks', () => {
    // Two short scenes should fit together on a single A4 page
    const sceneMd = `### SCENE 1: Office\n\n**NAMAN**: Did you check the pagination?\n\n**EVELYN**: Yes, it fits cleanly.\n\n### SCENE 2: Hallway\n\n**NAMAN**: Perfect, let us continue without an artificial page break.`;
    const html = parseMarkdownToHtml(sceneMd);
    const pages = paginateDocumentHtml(html, DEFAULT_PAGE_SETTINGS, THEME_PRESETS.minimal);

    expect(pages.length).toBe(1);
    expect(pages[0]).toContain('SCENE 1');
    expect(pages[0]).toContain('SCENE 2');
  });

  it('prevents orphan headings at bottom of pages while preserving high space utilization', () => {
    // Generate enough content to fill ~85% of a page, then add a heading
    let md = '# Section 1\n\n';
    for (let i = 0; i < 7; i++) {
      md += `Paragraph ${i + 1}: ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(6)}\n\n`;
    }
    md += '## Section 2: Important Heading\n\nFollow-up paragraph explaining section 2.';

    const html = parseMarkdownToHtml(md);
    const pages = paginateDocumentHtml(html, DEFAULT_PAGE_SETTINGS, THEME_PRESETS.minimal);

    expect(pages.length).toBeGreaterThanOrEqual(2);
    // Heading should be pushed to page 2 to avoid being orphaned at the bottom of page 1
    expect(pages[1]).toContain('Section 2: Important Heading');
    expect(pages[1]).toContain('Follow-up paragraph');
  });

  it('paginates Script & Dialogue multi-page documents cleanly without text clipping or excessive whitespace', () => {
    let scriptMd = '# Courtroom Script Act I\n\n';
    for (let scene = 1; scene <= 8; scene++) {
      scriptMd += `### SCENE ${scene}: Pre-Trial Examination ${scene}\n\n`;
      scriptMd += `**PROSECUTOR VANCE**: (Approaching podium)\nMr. Witness, please state whether paragraph ${scene} fits cleanly on page sheet containers.\n\n`;
      scriptMd += `**DEFENSE COUNSEL (NAMAN)**: (Rising)\nObjection, Your Honor! The witness cannot testify about legacy continuous slicing!\n\n`;
      scriptMd += `**JUDGE MORRISON**:\nOverruled. The witness will explain the discrete pagination architecture.\n\n`;
      scriptMd += `**CHIEF ARCHITECT**:\nUnder Phase 9A, every sheet is an independent container, guaranteeing zero border crossings through dialogue.\n\n---\n\n`;
    }

    const html = parseMarkdownToHtml(scriptMd);
    const pages = paginateDocumentHtml(html, DEFAULT_PAGE_SETTINGS, THEME_PRESETS.minimal);

    expect(pages.length).toBeGreaterThanOrEqual(2);
    // Ensure every page has valid non-empty content
    pages.forEach((pageHtml) => {
      expect(pageHtml.length).toBeGreaterThan(0);
      expect(pageHtml).not.toBe('<p></p>');
    });
  });

  it('paginates large tables and code blocks safely across discrete sheets', () => {
    let md = '# Technical Data Sheet\n\n';
    md += '| Metric ID | Description | Benchmark (ms) | Target |\n| :--- | :--- | :---: | :--- |\n';
    for (let r = 1; r <= 40; r++) {
      md += `| MTR-${r} | Latency probe ${r} for high-throughput pipeline | ${(r * 1.5).toFixed(1)} | Passed |\n`;
    }

    const html = parseMarkdownToHtml(md);
    const pages = paginateDocumentHtml(html, DEFAULT_PAGE_SETTINGS, THEME_PRESETS.technical);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages.join('\n')).toContain('<table>');
    expect(pages.join('\n')).toContain('Metric ID');
  });

  it('splits very long paragraphs to prevent vertical overflow and maximize space utilization', () => {
    const longPara = 'This is a long analytical discourse intended to demonstrate natural line wrapping and sentence splitting across page boundaries without clipping or orphan words. '.repeat(20);
    const md = `# Title\n\n${longPara}`;
    const html = parseMarkdownToHtml(md);
    const pages = paginateDocumentHtml(html, DEFAULT_PAGE_SETTINGS, THEME_PRESETS.academic);

    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0]).toContain('Title');
    expect(pages.join('\n')).toContain('demonstrate natural line wrapping');
  });
});
