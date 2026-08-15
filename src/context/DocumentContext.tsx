import React, { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  type DocumentModel,
  type DocumentMetadata,
  type SourceFormat,
  calculateMetadata,
  INITIAL_DOCUMENT_STATE,
} from '../models/document';
import { type PageSettings, DEFAULT_PAGE_SETTINGS } from '../models/settings';
import { type ThemeId, THEME_PRESETS } from '../models/theme';
import { SAMPLE_MARKDOWN_DOCUMENT } from '../models/sampleDocument';
import { parseToNormalizedDocument, normalizePlainTextToMarkdown } from '../lib/parser/markdownParser';
import { extractPdfContent } from '../lib/pdf/pdfImporter';
import { extractDocxContent } from '../lib/import/docxImporter';
import { parseHtmlToMarkdown } from '../lib/import/htmlImporter';
import { BUILT_IN_TEMPLATES, type TemplateId } from '../models/template';
import {
  type AIProviderConfig,
  type AITransformationResult,
  DEFAULT_AI_CONFIG,
} from '../models/ai';
import {
  getAllDocuments,
  saveDocument as persistDocument,
  deleteDocument as removeDocumentFromDb,
  duplicateDocument as cloneDocumentInDb,
  renameDocument as updateDocumentTitleInDb,
  type WorkspaceDocumentRecord,
} from '../lib/storage/workspaceStorage';
import { DocumentContext, type ViewMode, type SaveStatus } from './documentContextDefinition';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

interface AISnapshot {
  content: string;
  title: string;
}

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [doc, setDoc] = useState<DocumentModel>(() => {
    const initialContent = SAMPLE_MARKDOWN_DOCUMENT;
    return {
      ...INITIAL_DOCUMENT_STATE,
      id: generateDocId(),
      title: 'Quarterly Architecture & Engineering Report',
      content: initialContent,
      metadata: calculateMetadata(initialContent),
      isDirty: false,
    };
  });

  const [workspaceDocuments, setWorkspaceDocuments] = useState<WorkspaceDocumentRecord[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(DEFAULT_AI_CONFIG);
  const [lastAISnapshot, setLastAISnapshot] = useState<AISnapshot | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const isInitialMount = useRef(true);

  // Load workspace documents on mount
  const refreshWorkspaceDocuments = useCallback(async (): Promise<WorkspaceDocumentRecord[]> => {
    try {
      const docs = await getAllDocuments();
      setWorkspaceDocuments(docs);
      return docs;
    } catch (e) {
      console.warn('Failed to load workspace documents:', e);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    (async () => {
      const existingDocs = await refreshWorkspaceDocuments();
      if (existingDocs.length > 0) {
        const mostRecent = existingDocs[0];
        setDoc({
          id: mostRecent.id,
          title: mostRecent.title,
          content: mostRecent.content,
          sourceFormat: mostRecent.sourceFormat,
          theme: mostRecent.theme,
          settings: {
            ...DEFAULT_PAGE_SETTINGS,
            ...mostRecent.settings,
          },
          templateId: mostRecent.templateId,
          createdAt: mostRecent.createdAt,
          updatedAt: mostRecent.updatedAt,
          metadata: calculateMetadata(mostRecent.content, mostRecent.updatedAt),
          isDirty: false,
        });
        setActiveDocumentId(mostRecent.id);
      } else {
        // Create initial default document in workspace
        const initialRecord: WorkspaceDocumentRecord = {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          sourceFormat: doc.sourceFormat,
          theme: doc.theme,
          settings: doc.settings,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          wordCount: doc.metadata.wordCount,
        };
        await persistDocument(initialRecord);
        await refreshWorkspaceDocuments();
        setActiveDocumentId(doc.id);
      }
    })();
  }, [doc, refreshWorkspaceDocuments]);

  // Normalized document and parsed sanitized HTML memoized from content & title
  const normalizedDoc = useMemo(() => {
    return parseToNormalizedDocument(doc.content, doc.title);
  }, [doc.content, doc.title]);

  const parsedHtml = normalizedDoc.sanitizedHtml;

  // Auto-save debounced to IndexedDB / workspace storage
  useEffect(() => {
    if (!doc.isDirty) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const record: WorkspaceDocumentRecord = {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          sourceFormat: doc.sourceFormat,
          theme: doc.theme,
          settings: doc.settings,
          templateId: doc.templateId,
          createdAt: doc.createdAt,
          updatedAt: Date.now(),
          wordCount: doc.metadata.wordCount,
        };

        await persistDocument(record);
        setDoc((prev) => ({
          ...prev,
          isDirty: false,
          metadata: {
            ...prev.metadata,
            lastSavedAt: record.updatedAt,
          },
        }));
        await refreshWorkspaceDocuments();
        setSaveStatus('saved');
      } catch (e) {
        console.warn('Auto-save to workspace storage failed:', e);
        setSaveStatus('unsaved');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [doc, refreshWorkspaceDocuments]);

  // Synchronize CSS custom properties for page geometry and theme colors
  useEffect(() => {
    const root = document.documentElement;
    const isLetter = doc.settings.format === 'letter';
    const isLandscape = doc.settings.orientation === 'landscape';

    let width = isLetter ? '8.5in' : '210mm';
    let height = isLetter ? '11in' : '297mm';

    if (isLandscape) {
      const temp = width;
      width = height;
      height = temp;
    }

    let marginVal = '25mm';
    if (doc.settings.margins === 'compact') marginVal = '15mm';
    if (doc.settings.margins === 'relaxed') marginVal = '35mm';

    root.style.setProperty('--page-width', width);
    root.style.setProperty('--page-height', height);
    root.style.setProperty('--page-margin-top', marginVal);
    root.style.setProperty('--page-margin-right', marginVal);
    root.style.setProperty('--page-margin-bottom', marginVal);
    root.style.setProperty('--page-margin-left', marginVal);

    // Apply document theme tokens
    const currentTheme = THEME_PRESETS[doc.theme] || THEME_PRESETS.modern;
    root.style.setProperty('--doc-primary', currentTheme.primaryColor);
    root.style.setProperty('--doc-accent', currentTheme.accentColor);
    root.style.setProperty('--doc-text', currentTheme.textColor);
    root.style.setProperty('--doc-heading', currentTheme.headingColor);
    root.style.setProperty('--doc-border', currentTheme.borderColor);
    root.style.setProperty('--doc-code-bg', currentTheme.codeBgColor);
    root.style.setProperty('--doc-accent-bar', currentTheme.accentBarColor);
  }, [doc.settings, doc.theme]);

  const updateContent = useCallback((content: string, format: SourceFormat = 'markdown') => {
    setDoc((prev) => {
      const metadata: DocumentMetadata = calculateMetadata(content, prev.metadata.lastSavedAt);
      return {
        ...prev,
        content,
        sourceFormat: format,
        metadata,
        isDirty: true,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const updateTitle = useCallback((title: string) => {
    setDoc((prev) => ({
      ...prev,
      title: title.trim() ? title : 'Untitled Document',
      isDirty: true,
      updatedAt: Date.now(),
    }));
  }, []);

  const updateTheme = useCallback((theme: ThemeId) => {
    setDoc((prev) => ({
      ...prev,
      theme,
      isDirty: true,
      updatedAt: Date.now(),
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<PageSettings>) => {
    setDoc((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings,
      },
      isDirty: true,
      updatedAt: Date.now(),
    }));
  }, []);

  const updateAIConfig = useCallback((config: Partial<AIProviderConfig>) => {
    setAiConfig((prev) => ({ ...prev, ...config }));
  }, []);

  const applyAITransformation = useCallback((
    result: AITransformationResult,
    mode: 'replace' | 'insert' = 'replace'
  ) => {
    setDoc((prev) => {
      // Save current state for undo
      setLastAISnapshot({
        content: prev.content,
        title: prev.title,
      });

      let nextContent = '';
      if (mode === 'insert') {
        nextContent = prev.content.trim().length > 0
          ? `${prev.content.trim()}\n\n${result.transformedContent}`
          : result.transformedContent;
      } else {
        nextContent = result.transformedContent;
      }

      const nextTitle = result.suggestedTitle || prev.title;
      const metadata = calculateMetadata(nextContent, prev.metadata.lastSavedAt);

      return {
        ...prev,
        content: nextContent,
        title: nextTitle,
        metadata,
        isDirty: true,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const undoAITransformation = useCallback((): boolean => {
    if (!lastAISnapshot) return false;

    setDoc((prev) => {
      const metadata = calculateMetadata(lastAISnapshot.content, prev.metadata.lastSavedAt);
      return {
        ...prev,
        content: lastAISnapshot.content,
        title: lastAISnapshot.title,
        metadata,
        isDirty: true,
        updatedAt: Date.now(),
      };
    });

    setLastAISnapshot(null);
    return true;
  }, [lastAISnapshot]);

  const loadSampleDocument = useCallback(() => {
    const newId = generateDocId();
    const newDoc: DocumentModel = {
      ...INITIAL_DOCUMENT_STATE,
      id: newId,
      title: 'Quarterly Architecture & Engineering Report',
      content: SAMPLE_MARKDOWN_DOCUMENT,
      sourceFormat: 'markdown',
      metadata: calculateMetadata(SAMPLE_MARKDOWN_DOCUMENT),
      isDirty: false,
      updatedAt: Date.now(),
    };

    setDoc(newDoc);
    setActiveDocumentId(newId);
    persistDocument({
      id: newId,
      title: newDoc.title,
      content: newDoc.content,
      sourceFormat: newDoc.sourceFormat,
      theme: newDoc.theme,
      settings: newDoc.settings,
      createdAt: newDoc.createdAt,
      updatedAt: newDoc.updatedAt,
      wordCount: newDoc.metadata.wordCount,
    }).then(refreshWorkspaceDocuments);

    setSaveStatus('saved');
  }, [refreshWorkspaceDocuments]);

  const applyTemplate = useCallback((templateId: TemplateId, confirmIfDirty: boolean = true): boolean => {
    const template = BUILT_IN_TEMPLATES[templateId];
    if (!template) return false;

    if (confirmIfDirty && doc.content.trim().length > 0 && doc.isDirty) {
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(`Apply template "${template.name}"? Any unsaved edits in your current document will be replaced.`);
        if (!confirmed) return false;
      }
    }

    const newId = generateDocId();
    const now = Date.now();
    const newDoc: DocumentModel = {
      id: newId,
      title: template.title,
      content: template.starterContent,
      sourceFormat: 'markdown',
      theme: template.recommendedTheme,
      templateId: template.id,
      settings: {
        ...DEFAULT_PAGE_SETTINGS,
        ...template.defaultSettings,
      },
      metadata: calculateMetadata(template.starterContent),
      isDirty: false,
      createdAt: now,
      updatedAt: now,
    };

    setDoc(newDoc);
    setActiveDocumentId(newId);
    persistDocument({
      id: newId,
      title: newDoc.title,
      content: newDoc.content,
      sourceFormat: newDoc.sourceFormat,
      theme: newDoc.theme,
      settings: newDoc.settings,
      templateId: newDoc.templateId,
      createdAt: now,
      updatedAt: now,
      wordCount: newDoc.metadata.wordCount,
    }).then(refreshWorkspaceDocuments);

    setIsTemplateModalOpen(false);
    return true;
  }, [doc.content, doc.isDirty, refreshWorkspaceDocuments]);

  const createNewDocument = useCallback((confirmIfDirty: boolean = true): boolean => {
    if (confirmIfDirty && doc.content.trim().length > 0 && doc.isDirty) {
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm('Create a new blank document? Any unsaved changes in this session will be cleared.');
        if (!confirmed) return false;
      }
    }

    const newId = generateDocId();
    const now = Date.now();
    const newDoc: DocumentModel = {
      ...INITIAL_DOCUMENT_STATE,
      id: newId,
      title: 'Untitled Document',
      content: '',
      sourceFormat: 'markdown',
      metadata: calculateMetadata(''),
      isDirty: false,
      createdAt: now,
      updatedAt: now,
    };

    setDoc(newDoc);
    setActiveDocumentId(newId);
    persistDocument({
      id: newId,
      title: newDoc.title,
      content: newDoc.content,
      sourceFormat: newDoc.sourceFormat,
      theme: newDoc.theme,
      settings: newDoc.settings,
      createdAt: now,
      updatedAt: now,
      wordCount: 0,
    }).then(refreshWorkspaceDocuments);

    return true;
  }, [doc.content, doc.isDirty, refreshWorkspaceDocuments]);

  const openWorkspaceDocument = useCallback(async (id: string, confirmIfDirty: boolean = true): Promise<boolean> => {
    if (id === doc.id) {
      setIsWorkspaceOpen(false);
      return true;
    }

    if (confirmIfDirty && doc.content.trim().length > 0 && doc.isDirty) {
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm('Switch to another document? Any unsaved edits in your current document will be replaced.');
        if (!confirmed) return false;
      }
    }

    const docs = await getAllDocuments();
    const target = docs.find((d) => d.id === id);
    if (!target) {
      console.warn(`Document ${id} not found`);
      return false;
    }

    setDoc({
      id: target.id,
      title: target.title,
      content: target.content,
      sourceFormat: target.sourceFormat,
      theme: target.theme,
      settings: {
        ...DEFAULT_PAGE_SETTINGS,
        ...target.settings,
      },
      templateId: target.templateId,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      metadata: calculateMetadata(target.content, target.updatedAt),
      isDirty: false,
    });
    setActiveDocumentId(target.id);
    setIsWorkspaceOpen(false);
    return true;
  }, [doc.id, doc.content, doc.isDirty]);

  const createWorkspaceDocument = useCallback(async (options?: Partial<WorkspaceDocumentRecord>): Promise<string> => {
    const newId = generateDocId();
    const now = Date.now();
    const record: WorkspaceDocumentRecord = {
      id: newId,
      title: options?.title?.trim() || 'Untitled Document',
      content: options?.content || '',
      sourceFormat: options?.sourceFormat || 'markdown',
      theme: options?.theme || 'modern',
      settings: options?.settings || { ...DEFAULT_PAGE_SETTINGS },
      templateId: options?.templateId,
      createdAt: now,
      updatedAt: now,
      wordCount: (options?.content || '').trim().split(/\s+/).filter(Boolean).length,
    };

    await persistDocument(record);
    await refreshWorkspaceDocuments();
    await openWorkspaceDocument(newId, false);
    return newId;
  }, [openWorkspaceDocument, refreshWorkspaceDocuments]);

  const renameWorkspaceDocument = useCallback(async (id: string, newTitle: string): Promise<void> => {
    await updateDocumentTitleInDb(id, newTitle);
    if (doc.id === id) {
      setDoc((prev) => ({
        ...prev,
        title: newTitle.trim() || 'Untitled Document',
      }));
    }
    await refreshWorkspaceDocuments();
  }, [doc.id, refreshWorkspaceDocuments]);

  const duplicateWorkspaceDocument = useCallback(async (id: string): Promise<string | null> => {
    const dup = await cloneDocumentInDb(id);
    if (dup) {
      await refreshWorkspaceDocuments();
      return dup.id;
    }
    return null;
  }, [refreshWorkspaceDocuments]);

  const deleteWorkspaceDocument = useCallback(async (id: string): Promise<void> => {
    await removeDocumentFromDb(id);
    const updated = await refreshWorkspaceDocuments();

    if (doc.id === id) {
      if (updated.length > 0) {
        await openWorkspaceDocument(updated[0].id, false);
      } else {
        createNewDocument(false);
      }
    }
  }, [doc.id, createNewDocument, openWorkspaceDocument, refreshWorkspaceDocuments]);

  const loadFile = useCallback(async (file: File): Promise<{ success: boolean; error?: string; warnings?: string[] }> => {
    if (!file) {
      return { success: false, error: 'No file provided.' };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.` };
    }

    const filename = file.name.toLowerCase();
    const isPdf = filename.endsWith('.pdf') || file.type === 'application/pdf';
    const isDocx = filename.endsWith('.docx') || file.type.includes('wordprocessingml');
    const isHtml = filename.endsWith('.html') || filename.endsWith('.htm') || file.type.includes('html');
    const isMarkdown = filename.endsWith('.md') || filename.endsWith('.markdown') || file.type.includes('markdown');
    const isPlainText = filename.endsWith('.txt') || file.type.includes('plain');

    if (!isMarkdown && !isPlainText && !isPdf && !isDocx && !isHtml) {
      return { success: false, error: 'Unsupported file format. Please upload a .md, .markdown, .txt, .pdf, .docx, or .html file.' };
    }

    let title = file.name.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Imported Document';
    let content = '';
    let format: SourceFormat = 'markdown';
    let warnings: string[] | undefined;

    if (isDocx) {
      try {
        const docxResult = await extractDocxContent(file, file.name);
        if (!docxResult.success) {
          return { success: false, error: docxResult.error || 'Failed to extract content from DOCX file.' };
        }
        title = docxResult.title;
        content = docxResult.markdownContent;
        format = 'docx';
        warnings = docxResult.warnings;
      } catch (docxErr) {
        console.error('DOCX extraction failure:', docxErr);
        return { success: false, error: 'Failed to process DOCX document.' };
      }
    } else if (isHtml) {
      try {
        const htmlText = await file.text();
        const htmlResult = parseHtmlToMarkdown(htmlText, file.name);
        if (!htmlResult.success) {
          return { success: false, error: htmlResult.error || 'Failed to extract content from HTML file.' };
        }
        title = htmlResult.title;
        content = htmlResult.markdownContent;
        format = 'html';
        warnings = htmlResult.warnings;
      } catch (htmlErr) {
        console.error('HTML extraction failure:', htmlErr);
        return { success: false, error: 'Failed to process HTML document.' };
      }
    } else if (isPdf) {
      try {
        const pdfResult = await extractPdfContent(file, file.name);
        if (!pdfResult.success) {
          return { success: false, error: pdfResult.error || 'Failed to extract content from PDF.' };
        }
        title = pdfResult.title;
        content = pdfResult.markdownContent;
        format = 'pdf';
        warnings = pdfResult.warnings;
      } catch (pdfErr) {
        console.error('PDF extraction failure:', pdfErr);
        return { success: false, error: 'Failed to process PDF document.' };
      }
    } else {
      try {
        const text = await file.text();
        format = isMarkdown ? 'markdown' : 'plain-text';
        content = isPlainText ? normalizePlainTextToMarkdown(text) : text;
      } catch (err) {
        console.error('File read error:', err);
        return { success: false, error: 'Failed to read file content.' };
      }
    }

    const newId = generateDocId();
    const now = Date.now();
    const newDoc: DocumentModel = {
      ...INITIAL_DOCUMENT_STATE,
      id: newId,
      title,
      content,
      sourceFormat: format,
      metadata: calculateMetadata(content),
      isDirty: false,
      createdAt: now,
      updatedAt: now,
    };

    setDoc(newDoc);
    setActiveDocumentId(newId);
    await persistDocument({
      id: newId,
      title: newDoc.title,
      content: newDoc.content,
      sourceFormat: newDoc.sourceFormat,
      theme: newDoc.theme,
      settings: newDoc.settings,
      createdAt: now,
      updatedAt: now,
      wordCount: newDoc.metadata.wordCount,
    });
    await refreshWorkspaceDocuments();

    return { success: true, warnings };
  }, [refreshWorkspaceDocuments]);

  const saveDocument = useCallback(() => {
    persistDocument({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      sourceFormat: doc.sourceFormat,
      theme: doc.theme,
      settings: doc.settings,
      templateId: doc.templateId,
      createdAt: doc.createdAt,
      updatedAt: Date.now(),
      wordCount: doc.metadata.wordCount,
    }).then(async () => {
      setDoc((prev) => ({
        ...prev,
        isDirty: false,
        metadata: {
          ...prev.metadata,
          lastSavedAt: Date.now(),
        },
      }));
      await refreshWorkspaceDocuments();
      setSaveStatus('saved');
    }).catch((e) => {
      console.error('Failed to save document:', e);
      setSaveStatus('unsaved');
    });
  }, [doc, refreshWorkspaceDocuments]);

  return (
    <DocumentContext.Provider
      value={{
        document: doc,
        normalizedDoc,
        parsedHtml,
        viewMode,
        isSettingsOpen,
        isTemplateModalOpen,
        isWorkspaceOpen,
        isAIModalOpen,
        workspaceDocuments,
        activeDocumentId,
        zoomLevel,
        saveStatus,
        aiConfig,
        canUndoAI: Boolean(lastAISnapshot),
        updateContent,
        updateTitle,
        updateTheme,
        updateSettings,
        setViewMode,
        setIsSettingsOpen,
        setIsTemplateModalOpen,
        setIsWorkspaceOpen,
        setIsAIModalOpen,
        setZoomLevel,
        updateAIConfig,
        applyAITransformation,
        undoAITransformation,
        loadSampleDocument,
        createNewDocument,
        applyTemplate,
        loadFile,
        saveDocument,
        openWorkspaceDocument,
        createWorkspaceDocument,
        renameWorkspaceDocument,
        duplicateWorkspaceDocument,
        deleteWorkspaceDocument,
        refreshWorkspaceDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};
