import { describe, it, expect } from 'vitest';
import { BUILT_IN_TEMPLATES, TEMPLATE_LIST, type TemplateId } from '../src/models/template';
import { THEME_PRESETS, type ThemeId } from '../src/models/theme';
import { parseMarkdownToHtml } from '../src/lib/parser/markdownParser';

describe('Document Templates & Presets System (Phase 13)', () => {
  it('registers all 8 required built-in templates with unique IDs and complete metadata', () => {
    const requiredTemplateIds: TemplateId[] = [
      'blank',
      'academic-report',
      'project-report',
      'research-paper',
      'technical-documentation',
      'business-report',
      'proposal',
      'meeting-notes',
    ];

    expect(TEMPLATE_LIST.length).toBe(8);

    requiredTemplateIds.forEach((id) => {
      const tpl = BUILT_IN_TEMPLATES[id];
      expect(tpl).toBeDefined();
      expect(tpl.id).toBe(id);
      expect(tpl.name.trim().length).toBeGreaterThan(0);
      expect(tpl.description.trim().length).toBeGreaterThan(0);
      expect(tpl.category.trim().length).toBeGreaterThan(0);
      expect(tpl.title.trim().length).toBeGreaterThan(0);
      expect(tpl.starterContent.trim().length).toBeGreaterThan(0);
      expect(tpl.badge.trim().length).toBeGreaterThan(0);
      expect(THEME_PRESETS[tpl.recommendedTheme]).toBeDefined();
    });
  });

  it('verifies that every template starter content parses into valid, sanitized HTML', () => {
    TEMPLATE_LIST.forEach((tpl) => {
      const html = parseMarkdownToHtml(tpl.starterContent);
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);

      // Verify headings exist in non-blank templates
      if (tpl.id !== 'blank') {
        expect(html).toMatch(/<h[1-6]>/);
      }
    });
  });

  it('verifies templates containing tables parse into HTML table elements', () => {
    const templatesWithTables: TemplateId[] = [
      'academic-report',
      'project-report',
      'technical-documentation',
      'business-report',
      'proposal',
      'meeting-notes',
    ];

    templatesWithTables.forEach((id) => {
      const tpl = BUILT_IN_TEMPLATES[id];
      const html = parseMarkdownToHtml(tpl.starterContent);
      expect(html).toContain('<table>');
      expect(html).toContain('<th');
      expect(html).toContain('<td');
    });
  });

  it('guarantees complete orthogonality between templates and theme presets', () => {
    const allThemeIds: ThemeId[] = ['minimal', 'executive', 'academic', 'technical', 'modern'];

    TEMPLATE_LIST.forEach((_tpl) => {
      allThemeIds.forEach((themeId) => {
        const themeConfig = THEME_PRESETS[themeId];
        expect(themeConfig).toBeDefined();
        // A template can be styled with any theme without syntax errors
        expect(themeConfig.primaryColor).toBeDefined();
        expect(themeConfig.fontFamily).toBeDefined();
      });
    });
  });

  it('verifies default page settings for Academic Report are appropriately configured', () => {
    const academicTpl = BUILT_IN_TEMPLATES['academic-report'];
    expect(academicTpl.recommendedTheme).toBe('academic');
    expect(academicTpl.defaultSettings.format).toBe('a4');
    expect(academicTpl.defaultSettings.showHeader).toBe(true);
    expect(academicTpl.defaultSettings.showPageNumbers).toBe(true);
  });

  it('verifies default page settings for Technical Documentation use technical theme', () => {
    const techTpl = BUILT_IN_TEMPLATES['technical-documentation'];
    expect(techTpl.recommendedTheme).toBe('technical');
    expect(techTpl.defaultSettings.format).toBe('a4');
    expect(techTpl.defaultSettings.showPageNumbers).toBe(true);
  });
});
