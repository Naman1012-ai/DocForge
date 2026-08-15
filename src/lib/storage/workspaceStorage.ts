import type { SourceFormat } from '../../models/document';
import type { PageSettings } from '../../models/settings';
import { DEFAULT_PAGE_SETTINGS } from '../../models/settings';
import type { ThemeId } from '../../models/theme';
import type { TemplateId } from '../../models/template';

export interface WorkspaceDocumentRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  sourceFormat: SourceFormat;
  templateId?: TemplateId;
  theme: ThemeId;
  settings: PageSettings;
  content: string;
  wordCount: number;
  pageCount?: number;
}

const DB_NAME = 'DocForgeWorkspaceDB';
const STORE_NAME = 'documents';
const DB_VERSION = 1;
const FALLBACK_STORAGE_KEY = 'docforge_workspace_records_v1';

// In-memory cache & fallback store for non-IDB environments (tests, sandboxed iframes)
let memoryStore: Map<string, WorkspaceDocumentRecord> = new Map();

function hasIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('title', 'title', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Validates whether an untrusted record matches the WorkspaceDocumentRecord schema
 */
export function isValidWorkspaceRecord(record: unknown): record is WorkspaceDocumentRecord {
  if (!record || typeof record !== 'object') return false;
  const r = record as Partial<WorkspaceDocumentRecord>;
  return (
    typeof r.id === 'string' &&
    r.id.trim().length > 0 &&
    typeof r.title === 'string' &&
    typeof r.content === 'string' &&
    typeof r.createdAt === 'number' &&
    typeof r.updatedAt === 'number' &&
    typeof r.theme === 'string' &&
    typeof r.sourceFormat === 'string'
  );
}

/**
 * Normalizes record data applying safe defaults if partial settings are missing
 */
export function normalizeRecord(r: WorkspaceDocumentRecord): WorkspaceDocumentRecord {
  return {
    ...r,
    title: r.title.trim() || 'Untitled Document',
    settings: {
      ...DEFAULT_PAGE_SETTINGS,
      ...(r.settings || {}),
    },
    wordCount: typeof r.wordCount === 'number' ? r.wordCount : (r.content.trim().split(/\s+/).filter(Boolean).length),
  };
}

/**
 * Retrieves all saved documents sorted by updatedAt descending
 */
export async function getAllDocuments(): Promise<WorkspaceDocumentRecord[]> {
  if (hasIndexedDb()) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const rawList = request.result || [];
          const validList: WorkspaceDocumentRecord[] = [];
          for (const item of rawList) {
            if (isValidWorkspaceRecord(item)) {
              validList.push(normalizeRecord(item));
            } else {
              console.warn('Skipping corrupted workspace record:', item);
            }
          }
          validList.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(validList);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('IndexedDB getAll failed, using fallback storage:', e);
    }
  }

  // LocalStorage / Memory Fallback
  try {
    if (typeof localStorage !== 'undefined') {
      const serialized = localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isValidWorkspaceRecord).map(normalizeRecord);
          valid.sort((a, b) => b.updatedAt - a.updatedAt);
          return valid;
        }
      }
    }
  } catch (e) {
    console.warn('LocalStorage fallback failed:', e);
  }

  return Array.from(memoryStore.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Retrieves a single document by its unique ID
 */
export async function getDocumentById(id: string): Promise<WorkspaceDocumentRecord | null> {
  if (!id) return null;

  if (hasIndexedDb()) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          const item = request.result;
          if (item && isValidWorkspaceRecord(item)) {
            resolve(normalizeRecord(item));
          } else {
            resolve(null);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn(`IndexedDB get(${id}) failed, trying fallback:`, e);
    }
  }

  const all = await getAllDocuments();
  return all.find((d) => d.id === id) || memoryStore.get(id) || null;
}

/**
 * Saves or updates a document record
 */
export async function saveDocument(record: WorkspaceDocumentRecord): Promise<void> {
  const normalized = normalizeRecord(record);

  // Update in-memory fallback cache
  memoryStore.set(normalized.id, normalized);

  if (hasIndexedDb()) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(normalized);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('IndexedDB save failed, falling back to LocalStorage:', e);
    }
  }

  // LocalStorage Fallback sync
  try {
    if (typeof localStorage !== 'undefined') {
      const all = Array.from(memoryStore.values());
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(all));
    }
  } catch (e) {
    console.warn('LocalStorage fallback write failed:', e);
  }
}

/**
 * Deletes a document record by ID
 */
export async function deleteDocument(id: string): Promise<void> {
  memoryStore.delete(id);

  if (hasIndexedDb()) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn(`IndexedDB delete(${id}) failed:`, e);
    }
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const all = Array.from(memoryStore.values());
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(all));
    }
  } catch (e) {
    console.warn('LocalStorage fallback write failed:', e);
  }
}

/**
 * Duplicates a document with an independent ID and timestamp
 */
export async function duplicateDocument(id: string): Promise<WorkspaceDocumentRecord | null> {
  const original = await getDocumentById(id);
  if (!original) return null;

  const now = Date.now();
  const newId = `doc_${now}_${Math.random().toString(36).substring(2, 9)}`;
  const duplicateRecord: WorkspaceDocumentRecord = {
    ...JSON.parse(JSON.stringify(original)),
    id: newId,
    title: `${original.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };

  await saveDocument(duplicateRecord);
  return duplicateRecord;
}

/**
 * Renames an existing document
 */
export async function renameDocument(id: string, newTitle: string): Promise<WorkspaceDocumentRecord | null> {
  const original = await getDocumentById(id);
  if (!original) return null;

  const cleanTitle = newTitle.trim() || 'Untitled Document';
  const updatedRecord: WorkspaceDocumentRecord = {
    ...original,
    title: cleanTitle,
    updatedAt: Date.now(),
  };

  await saveDocument(updatedRecord);
  return updatedRecord;
}

/**
 * Clears in-memory store (primarily for unit tests)
 */
export function resetMemoryStore(): void {
  memoryStore.clear();
}
