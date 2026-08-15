import { describe, it, expect } from 'vitest';
import { calculateMetadata, INITIAL_DOCUMENT_STATE, type DocumentModel } from '../src/models/document';
import { DEFAULT_PAGE_SETTINGS } from '../src/models/settings';

describe('Persistence Resilience & Storage Migration', () => {
  it('deserializes complete valid document state cleanly', () => {
    const json = JSON.stringify({
      id: 'doc-12345',
      title: 'Quarterly Review',
      content: '# Review Content',
      sourceFormat: 'markdown',
      theme: 'executive',
      settings: {
        ...DEFAULT_PAGE_SETTINGS,
        format: 'letter',
        margins: 'compact',
      },
      updatedAt: 1700000000000,
    });

    const parsed = JSON.parse(json);
    const restoredDoc: DocumentModel = {
      ...INITIAL_DOCUMENT_STATE,
      ...parsed,
      settings: {
        ...INITIAL_DOCUMENT_STATE.settings,
        ...(parsed.settings || {}),
      },
      metadata: calculateMetadata(parsed.content || '', parsed.updatedAt),
      isDirty: false,
    };

    expect(restoredDoc.id).toBe('doc-12345');
    expect(restoredDoc.title).toBe('Quarterly Review');
    expect(restoredDoc.theme).toBe('executive');
    expect(restoredDoc.settings.format).toBe('letter');
    expect(restoredDoc.settings.margins).toBe('compact');
    expect(restoredDoc.metadata.wordCount).toBe(3);
  });

  it('handles partial / legacy settings by falling back to default values', () => {
    const legacyJson = JSON.stringify({
      id: 'doc-legacy',
      title: 'Old Doc',
      content: 'Hello legacy world',
      // Settings object is completely missing
    });

    const parsed = JSON.parse(legacyJson);
    const restoredDoc: DocumentModel = {
      ...INITIAL_DOCUMENT_STATE,
      ...parsed,
      settings: {
        ...INITIAL_DOCUMENT_STATE.settings,
        ...(parsed.settings || {}),
      },
      metadata: calculateMetadata(parsed.content || '', parsed.updatedAt),
      isDirty: false,
    };

    expect(restoredDoc.settings.format).toBe('a4');
    expect(restoredDoc.settings.margins).toBe('standard');
    expect(restoredDoc.settings.fontSizeScale).toBe('standard');
    expect(restoredDoc.settings.lineSpacing).toBe('standard');
  });

  it('handles corrupted content field safely without throwing', () => {
    const corruptedJson = JSON.stringify({
      title: 'Corrupted Doc',
      content: null, // content is null
    });

    const parsed = JSON.parse(corruptedJson);
    const content = typeof parsed.content === 'string' ? parsed.content : '';
    const metadata = calculateMetadata(content);

    expect(metadata.wordCount).toBe(0);
    expect(metadata.lineCount).toBe(0);
  });
});
