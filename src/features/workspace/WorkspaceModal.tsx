import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Upload,
  FileText,
  Copy,
  Trash2,
  Edit2,
  Clock,
  HardDrive,
  ArrowUpDown,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import type { WorkspaceDocumentRecord } from '../../lib/storage/workspaceStorage';
import { BUILT_IN_TEMPLATES } from '../../models/template';
import { THEME_PRESETS } from '../../models/theme';

type SortOption = 'updated-desc' | 'created-desc' | 'title-asc' | 'title-desc';
type FilterFormat = 'all' | 'markdown' | 'pdf' | 'docx' | 'html' | 'template';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getFormatBadge(record: WorkspaceDocumentRecord) {
  if (record.templateId) {
    return {
      label: BUILT_IN_TEMPLATES[record.templateId]?.badge || 'Template',
      className: 'badge-template',
    };
  }
  switch (record.sourceFormat) {
    case 'pdf':
      return { label: 'PDF', className: 'badge-pdf' };
    case 'docx':
      return { label: 'DOCX', className: 'badge-docx' };
    case 'html':
      return { label: 'HTML', className: 'badge-html' };
    case 'plain-text':
      return { label: 'TXT', className: 'badge-txt' };
    default:
      return { label: 'MD', className: 'badge-md' };
  }
}

export const WorkspaceModal: React.FC = () => {
  const {
    isWorkspaceOpen,
    setIsWorkspaceOpen,
    workspaceDocuments,
    document: activeDoc,
    openWorkspaceDocument,
    renameWorkspaceDocument,
    duplicateWorkspaceDocument,
    deleteWorkspaceDocument,
    setIsTemplateModalOpen,
    loadFile,
  } = useDocument();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('updated-desc');
  const [filterFormat, setFilterFormat] = useState<FilterFormat>('all');
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isWorkspaceOpen) {
      setRenamingDocId(null);
      setDeletingDocId(null);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isWorkspaceOpen]);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isWorkspaceOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deletingDocId) {
          setDeletingDocId(null);
        } else if (renamingDocId) {
          setRenamingDocId(null);
        } else {
          setIsWorkspaceOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWorkspaceOpen, deletingDocId, renamingDocId, setIsWorkspaceOpen]);

  // Filter and sort documents
  const filteredAndSortedDocs = useMemo(() => {
    return workspaceDocuments
      .filter((doc) => {
        // Search query check
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = doc.title.toLowerCase().includes(q);
          const matchFormat = doc.sourceFormat.toLowerCase().includes(q);
          const matchTemplate = doc.templateId ? doc.templateId.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchFormat && !matchTemplate) return false;
        }

        // Format filter check
        if (filterFormat === 'all') return true;
        if (filterFormat === 'template') return Boolean(doc.templateId);
        return doc.sourceFormat === filterFormat;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'updated-desc':
            return b.updatedAt - a.updatedAt;
          case 'created-desc':
            return b.createdAt - a.createdAt;
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          default:
            return b.updatedAt - a.updatedAt;
        }
      });
  }, [workspaceDocuments, searchQuery, sortOption, filterFormat]);

  if (!isWorkspaceOpen) return null;

  const handleStartRename = (doc: WorkspaceDocumentRecord) => {
    setRenamingDocId(doc.id);
    setRenameTitleInput(doc.title);
  };

  const handleSaveRename = async (id: string) => {
    if (renameTitleInput.trim().length > 0) {
      await renameWorkspaceDocument(id, renameTitleInput.trim());
    }
    setRenamingDocId(null);
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteWorkspaceDocument(id);
    setDeletingDocId(null);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadFile(file);
      setIsWorkspaceOpen(false);
    }
    if (e.target) e.target.value = '';
  };

  const targetDeleteDoc = workspaceDocuments.find((d) => d.id === deletingDocId);

  return (
    <div
      className="docforge-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsWorkspaceOpen(false);
      }}
    >
      <div
        className="docforge-workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="docforge-workspace-title"
      >
        {/* Modal Header */}
        <div className="docforge-workspace-modal-header">
          <div className="docforge-workspace-header-left">
            <div className="docforge-workspace-title-row">
              <h2 id="docforge-workspace-title">Local Document Workspace</h2>
              <span className="docforge-privacy-pill">
                <HardDrive size={12} />
                <span>Stored locally on this device</span>
              </span>
            </div>
            <p className="docforge-workspace-subtitle">
              Manage, reopen, duplicate, and search all your saved DocForge documents.
            </p>
          </div>
          <button
            type="button"
            className="docforge-modal-close"
            onClick={() => setIsWorkspaceOpen(false)}
            aria-label="Close workspace"
          >
            <X size={18} />
          </button>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {deletingDocId && targetDeleteDoc && (
          <div className="docforge-workspace-delete-banner" role="alert">
            <AlertTriangle size={18} />
            <div className="docforge-delete-text">
              <strong>Delete &quot;{targetDeleteDoc.title}&quot;?</strong>
              <span>This document will be permanently deleted from local storage.</span>
            </div>
            <div className="docforge-delete-actions">
              <button
                type="button"
                className="docforge-btn docforge-btn-danger"
                onClick={() => handleConfirmDelete(deletingDocId)}
              >
                Delete Permanently
              </button>
              <button
                type="button"
                className="docforge-btn docforge-btn-ghost"
                onClick={() => setDeletingDocId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="docforge-workspace-toolbar">
          <div className="docforge-workspace-toolbar-left">
            {/* Search Input */}
            <div className="docforge-workspace-search-box">
              <Search size={14} className="docforge-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search documents by title or format…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="docforge-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  &times;
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="docforge-workspace-sort">
              <ArrowUpDown size={13} />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                aria-label="Sort documents"
              >
                <option value="updated-desc">Recently Modified</option>
                <option value="created-desc">Recently Created</option>
                <option value="title-asc">Title (A–Z)</option>
                <option value="title-desc">Title (Z–A)</option>
              </select>
            </div>
          </div>

          <div className="docforge-workspace-toolbar-right">
            <button
              type="button"
              className="docforge-btn docforge-btn-ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              <span>Import File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt,.pdf,.docx,.html"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />

            <button
              type="button"
              className="docforge-btn docforge-btn-primary"
              onClick={() => {
                setIsWorkspaceOpen(false);
                setIsTemplateModalOpen(true);
              }}
            >
              <Plus size={14} />
              <span>New Document</span>
            </button>
          </div>
        </div>

        {/* Format Filter Pills */}
        <div className="docforge-workspace-filters" role="tablist" aria-label="Format Filters">
          {(['all', 'markdown', 'pdf', 'docx', 'html', 'template'] as FilterFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              role="tab"
              aria-selected={filterFormat === fmt}
              className={`docforge-filter-pill ${filterFormat === fmt ? 'active' : ''}`}
              onClick={() => setFilterFormat(fmt)}
            >
              {fmt === 'all'
                ? 'All Documents'
                : fmt === 'markdown'
                ? 'Markdown'
                : fmt === 'pdf'
                ? 'PDF'
                : fmt === 'docx'
                ? 'DOCX'
                : fmt === 'html'
                ? 'HTML'
                : 'Templates'}
            </button>
          ))}
          <span className="docforge-filter-count">
            {filteredAndSortedDocs.length} {filteredAndSortedDocs.length === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {/* Document Grid / List */}
        <div className="docforge-workspace-body">
          {filteredAndSortedDocs.length === 0 ? (
            <div className="docforge-workspace-empty">
              <FileText size={40} className="docforge-empty-icon" />
              <h3>No documents found</h3>
              <p>
                {searchQuery
                  ? `No results match "${searchQuery}". Try a different search term.`
                  : 'Start by creating a new document or importing a file.'}
              </p>
              <div className="docforge-workspace-empty-actions">
                <button
                  type="button"
                  className="docforge-btn docforge-btn-primary"
                  onClick={() => {
                    setIsWorkspaceOpen(false);
                    setIsTemplateModalOpen(true);
                  }}
                >
                  <Plus size={14} />
                  <span>Create Document</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="docforge-workspace-grid" role="list">
              {filteredAndSortedDocs.map((item) => {
                const isActive = item.id === activeDoc.id;
                const badge = getFormatBadge(item);
                const isRenaming = renamingDocId === item.id;
                const themeName = THEME_PRESETS[item.theme]?.name || 'Modern Clean';

                return (
                  <div
                    key={item.id}
                    role="listitem"
                    className={`docforge-workspace-card ${isActive ? 'active-document' : ''}`}
                    onClick={() => openWorkspaceDocument(item.id, false)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        openWorkspaceDocument(item.id, false);
                      }
                    }}
                  >
                    <div className="docforge-card-top">
                      <div className="docforge-card-badge-row">
                        <span className={`docforge-badge ${badge.className}`}>{badge.label}</span>
                        {isActive && <span className="docforge-current-pill">Current</span>}
                      </div>

                      <div className="docforge-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="docforge-card-action-btn"
                          title="Rename document"
                          onClick={() => handleStartRename(item)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="docforge-card-action-btn"
                          title="Duplicate document"
                          onClick={() => duplicateWorkspaceDocument(item.id)}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          className="docforge-card-action-btn danger"
                          title="Delete document"
                          onClick={() => setDeletingDocId(item.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {isRenaming ? (
                      <div className="docforge-inline-rename" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameTitleInput}
                          onChange={(e) => setRenameTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(item.id);
                            if (e.key === 'Escape') setRenamingDocId(null);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="docforge-btn docforge-btn-primary small"
                          onClick={() => handleSaveRename(item.id)}
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <h3 className="docforge-card-title">{item.title}</h3>
                    )}

                    <div className="docforge-card-preview-snippet">
                      {item.content
                        ? item.content.replace(/[#*`_>[\]]/g, '').slice(0, 100).trim() || 'No text preview available'
                        : 'Blank document'}
                    </div>

                    <div className="docforge-card-footer">
                      <div className="docforge-card-meta">
                        <span className="docforge-meta-item">
                          <Clock size={12} />
                          <span>{formatRelativeTime(item.updatedAt)}</span>
                        </span>
                        <span className="docforge-meta-item">•</span>
                        <span className="docforge-meta-item">{item.wordCount} words</span>
                        <span className="docforge-meta-item">•</span>
                        <span className="docforge-meta-item">{themeName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
