import { type PageSettings, DEFAULT_PAGE_SETTINGS } from './settings';
import type { ThemeId } from './theme';
import type { TemplateId } from './template';

export type SourceFormat = 'markdown' | 'plain-text' | 'pdf' | 'docx' | 'html';

export interface DocumentMetadata {
  wordCount: number;
  charCount: number;
  lineCount: number;
  readingTimeMinutes: number;
  lastSavedAt?: number;
}

export interface DocumentModel {
  id: string;
  title: string;
  content: string;
  sourceFormat: SourceFormat;
  theme: ThemeId;
  templateId?: TemplateId;
  settings: PageSettings;
  metadata: DocumentMetadata;
  isDirty: boolean;
  createdAt: number;
  updatedAt: number;
}

export function calculateMetadata(content: string, lastSavedAt?: number): DocumentMetadata {
  const trimmed = content.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const lines = content.length === 0 ? 0 : content.split('\n').length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    wordCount: words,
    charCount: chars,
    lineCount: lines,
    readingTimeMinutes,
    lastSavedAt,
  };
}

export const INITIAL_DOCUMENT_STATE: DocumentModel = {
  id: 'doc-default',
  title: 'Quarterly Architecture & Engineering Report',
  content: '',
  sourceFormat: 'markdown',
  theme: 'modern',
  settings: DEFAULT_PAGE_SETTINGS,
  metadata: {
    wordCount: 0,
    charCount: 0,
    lineCount: 0,
    readingTimeMinutes: 1,
  },
  isDirty: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
