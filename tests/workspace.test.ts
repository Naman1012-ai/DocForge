import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  duplicateDocument,
  renameDocument,
  isValidWorkspaceRecord,
  resetMemoryStore,
  type WorkspaceDocumentRecord,
} from '../src/lib/storage/workspaceStorage';
import { DEFAULT_PAGE_SETTINGS } from '../src/models/settings';

describe('Local Document Workspace & Persistent Document Management (Phase 15)', () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  const sampleRecordA: WorkspaceDocumentRecord = {
    id: 'doc_test_101',
    title: 'Distributed Systems Whitepaper',
    content: '# Distributed Systems\n\nConsensus protocols overview.',
    sourceFormat: 'markdown',
    theme: 'modern',
    settings: { ...DEFAULT_PAGE_SETTINGS, format: 'a4', margins: 'standard' },
    createdAt: 1700000000000,
    updatedAt: 1700000050000,
    wordCount: 7,
  };

  const sampleRecordB: WorkspaceDocumentRecord = {
    id: 'doc_test_102',
    title: 'Financial Q3 Audit Report',
    content: '# Financial Audit\n\nBalance sheet analysis.',
    sourceFormat: 'pdf',
    templateId: 'business-report',
    theme: 'executive',
    settings: { ...DEFAULT_PAGE_SETTINGS, format: 'letter', margins: 'compact' },
    createdAt: 1700000010000,
    updatedAt: 1700000090000,
    wordCount: 6,
  };

  it('saves and retrieves workspace documents accurately', async () => {
    await saveDocument(sampleRecordA);
    await saveDocument(sampleRecordB);

    const all = await getAllDocuments();
    expect(all.length).toBe(2);

    const docA = await getDocumentById('doc_test_101');
    expect(docA).toBeDefined();
    expect(docA?.title).toBe('Distributed Systems Whitepaper');
    expect(docA?.content).toContain('Consensus protocols overview.');
    expect(docA?.settings.format).toBe('a4');
  });

  it('guarantees multi-document isolation (mutating A does not alter B)', async () => {
    await saveDocument(sampleRecordA);
    await saveDocument(sampleRecordB);

    // Mutate Document A
    const modifiedA: WorkspaceDocumentRecord = {
      ...sampleRecordA,
      title: 'Distributed Systems — Second Edition',
      content: '# Distributed Systems (Revised)',
      theme: 'technical',
      settings: { ...sampleRecordA.settings, margins: 'relaxed' },
      updatedAt: 1700000100000,
    };
    await saveDocument(modifiedA);

    // Check Document B
    const docB = await getDocumentById('doc_test_102');
    expect(docB).toBeDefined();
    expect(docB?.title).toBe('Financial Q3 Audit Report');
    expect(docB?.theme).toBe('executive');
    expect(docB?.settings.margins).toBe('compact');
    expect(docB?.settings.format).toBe('letter');
  });

  it('duplicates a document with an independent ID, title copy, and matching configuration', async () => {
    await saveDocument(sampleRecordA);

    const duplicate = await duplicateDocument('doc_test_101');
    expect(duplicate).toBeDefined();
    expect(duplicate?.id).not.toBe('doc_test_101');
    expect(duplicate?.title).toBe('Distributed Systems Whitepaper (Copy)');
    expect(duplicate?.content).toBe(sampleRecordA.content);
    expect(duplicate?.theme).toBe(sampleRecordA.theme);
    expect(duplicate?.settings.format).toBe(sampleRecordA.settings.format);

    const all = await getAllDocuments();
    expect(all.length).toBe(2);
  });

  it('renames an existing document without modifying its content or geometry', async () => {
    await saveDocument(sampleRecordA);

    const renamed = await renameDocument('doc_test_101', 'Enterprise Cloud Architecture');
    expect(renamed).toBeDefined();
    expect(renamed?.id).toBe('doc_test_101');
    expect(renamed?.title).toBe('Enterprise Cloud Architecture');
    expect(renamed?.content).toBe(sampleRecordA.content);
    expect(renamed?.settings.format).toBe(sampleRecordA.settings.format);
  });

  it('deletes a document and removes it permanently from workspace storage', async () => {
    await saveDocument(sampleRecordA);
    await saveDocument(sampleRecordB);

    await deleteDocument('doc_test_101');

    const remaining = await getAllDocuments();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('doc_test_102');

    const fetched = await getDocumentById('doc_test_101');
    expect(fetched).toBeNull();
  });

  it('validates records and safely quarantines corrupt/malformed storage records', () => {
    expect(isValidWorkspaceRecord(sampleRecordA)).toBe(true);
    expect(isValidWorkspaceRecord(null)).toBe(false);
    expect(isValidWorkspaceRecord({})).toBe(false);
    expect(isValidWorkspaceRecord({ id: '', title: 'Test' })).toBe(false);
    expect(isValidWorkspaceRecord({ id: '1', title: 'Test', content: 123 })).toBe(false);
  });
});
