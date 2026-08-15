import { createContext } from 'react';
import type { DocumentModel, SourceFormat } from '../models/document';
import type { PageSettings } from '../models/settings';
import type { ThemeId } from '../models/theme';
import type { TemplateId } from '../models/template';
import type { NormalizedDocument } from '../models/documentTree';
import type { WorkspaceDocumentRecord } from '../lib/storage/workspaceStorage';
import type { AIProviderConfig, AITransformationResult } from '../models/ai';

export type ViewMode = 'split' | 'editor' | 'preview';
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface DocumentContextType {
  document: DocumentModel;
  normalizedDoc: NormalizedDocument;
  parsedHtml: string;
  viewMode: ViewMode;
  isSettingsOpen: boolean;
  isTemplateModalOpen: boolean;
  isWorkspaceOpen: boolean;
  isAIModalOpen: boolean;
  workspaceDocuments: WorkspaceDocumentRecord[];
  activeDocumentId: string | null;
  zoomLevel: number;
  saveStatus: SaveStatus;
  aiConfig: AIProviderConfig;
  canUndoAI: boolean;
  updateContent: (content: string, format?: SourceFormat) => void;
  updateTitle: (title: string) => void;
  updateTheme: (theme: ThemeId) => void;
  updateSettings: (settings: Partial<PageSettings>) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTemplateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWorkspaceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  updateAIConfig: (config: Partial<AIProviderConfig>) => void;
  applyAITransformation: (
    result: AITransformationResult,
    mode?: 'replace' | 'insert'
  ) => void;
  undoAITransformation: () => boolean;
  loadSampleDocument: () => void;
  createNewDocument: (confirmIfDirty?: boolean) => boolean;
  applyTemplate: (templateId: TemplateId, confirmIfDirty?: boolean) => boolean;
  loadFile: (file: File) => Promise<{ success: boolean; error?: string; warnings?: string[] }>;
  saveDocument: () => void;
  openWorkspaceDocument: (id: string, confirmIfDirty?: boolean) => Promise<boolean>;
  createWorkspaceDocument: (options?: Partial<WorkspaceDocumentRecord>) => Promise<string>;
  renameWorkspaceDocument: (id: string, newTitle: string) => Promise<void>;
  duplicateWorkspaceDocument: (id: string) => Promise<string | null>;
  deleteWorkspaceDocument: (id: string) => Promise<void>;
  refreshWorkspaceDocuments: () => Promise<WorkspaceDocumentRecord[]>;
}

export const DocumentContext = createContext<DocumentContextType | undefined>(undefined);
