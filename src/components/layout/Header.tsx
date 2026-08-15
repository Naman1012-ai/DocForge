import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  Download,
  Printer,
  RotateCcw,
  Sparkles,
  Columns,
  Eye,
  Edit3,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Menu,
  X,
  ChevronDown,
  LayoutTemplate,
  Folder,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import { THEME_PRESETS } from '../../models/theme';
import { exportDocumentToPdf, triggerNativePrint } from '../../lib/pdf/pdfExportService';

export const Header: React.FC = () => {
  const {
    document: doc,
    viewMode,
    isSettingsOpen,
    saveStatus,
    updateTitle,
    setViewMode,
    setIsSettingsOpen,
    setIsTemplateModalOpen,
    setIsWorkspaceOpen,
    setIsAIModalOpen,
    loadSampleDocument,
    createNewDocument,
  } = useDocument();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(doc.title);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);

  // Close menus on Escape or outside click
  React.useEffect(() => {
    if (!isExportMenuOpen && !isMobileMenuOpen) return;
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.docforge-export-split-btn')) {
        setIsExportMenuOpen(false);
      }
      if (!target.closest('.docforge-mobile-nav') && !target.closest('.docforge-mobile-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKey);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleGlobalKey);
    };
  }, [isExportMenuOpen, isMobileMenuOpen]);

  const activeTheme = THEME_PRESETS[doc.theme] || THEME_PRESETS.modern;

  const handleTitleSubmit = () => {
    updateTitle(tempTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTempTitle(doc.title);
      setIsEditingTitle(false);
    }
  };

  const handleNewDocument = () => {
    createNewDocument(true);
  };

  const handleExportPdf = async () => {
    setIsExportMenuOpen(false);
    setIsMobileMenuOpen(false);

    if (exportState === 'exporting') return;

    const sheetElement = (
      document.querySelector('.docforge-preview-viewport .docforge-document-renderer') ||
      document.querySelector('#document-print-root .docforge-document-renderer') ||
      document.querySelector('.docforge-document-renderer') ||
      document.querySelector('.docforge-sheet')
    ) as HTMLElement;
    if (!sheetElement) {
      setExportState('error');
      setExportError('Document sheet element not found in DOM.');
      return;
    }

    setExportState('exporting');
    setExportError(null);

    try {
      const result = await exportDocumentToPdf({
        element: sheetElement,
        title: doc.title,
        settings: doc.settings,
        theme: activeTheme,
      });

      if (result.success) {
        setExportState('success');
        setTimeout(() => setExportState('idle'), 3000);
      } else {
        setExportState('error');
        setExportError(result.error || 'Failed to generate PDF.');
        setTimeout(() => setExportState('idle'), 5000);
      }
    } catch (err) {
      console.error('Export error:', err);
      setExportState('error');
      setExportError(err instanceof Error ? err.message : 'Unexpected PDF generation failure.');
      setTimeout(() => setExportState('idle'), 5000);
    }
  };

  const handlePrint = () => {
    setIsExportMenuOpen(false);
    setIsMobileMenuOpen(false);
    triggerNativePrint();
  };

  return (
    <header className="docforge-header" role="banner">
      <div className="docforge-header-left">
        <div className="docforge-brand" title="DocForge Document Engine">
          <div className="docforge-brand-icon">
            <FileText size={18} />
          </div>
          <span className="docforge-brand-name">DocForge</span>
        </div>

        <div className="docforge-header-divider" />

        {/* Editable Document Title */}
        <div className="docforge-title-container">
          {isEditingTitle ? (
            <input
              type="text"
              className="docforge-title-input"
              value={tempTitle}
              autoFocus
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              aria-label="Document Title"
            />
          ) : (
            <button
              type="button"
              className="docforge-title-button"
              onClick={() => {
                setTempTitle(doc.title);
                setIsEditingTitle(true);
              }}
              title="Click to rename document"
            >
              <span className="docforge-title-text">{doc.title}</span>
              <Edit3 size={12} className="docforge-title-edit-icon" />
            </button>
          )}

          {/* Dynamic Save / Persistence Indicator */}
          <div
            className={`docforge-save-status status-${saveStatus}`}
            title={
              saveStatus === 'saved'
                ? 'All changes saved locally in your browser'
                : saveStatus === 'saving'
                ? 'Saving changes...'
                : 'Unsaved local changes'
            }
          >
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 size={13} className="docforge-status-icon success" />
                <span className="docforge-status-label">Saved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <RefreshCw size={13} className="docforge-status-icon saving spin" />
                <span className="docforge-status-label">Saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <AlertCircle size={13} className="docforge-status-icon warning" />
                <span className="docforge-status-label">Unsaved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Responsive View Switcher */}
      <div className="docforge-header-center">
        <div className="docforge-segmented-control" role="group" aria-label="Workspace View Mode">
          <button
            type="button"
            className={`docforge-segment-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split View (Editor & Preview)"
          >
            <Columns size={14} />
            <span className="docforge-segment-label">Split</span>
          </button>
          <button
            type="button"
            className={`docforge-segment-btn ${viewMode === 'editor' ? 'active' : ''}`}
            onClick={() => setViewMode('editor')}
            title="Editor Only"
          >
            <Edit3 size={14} />
            <span className="docforge-segment-label">Write</span>
          </button>
          <button
            type="button"
            className={`docforge-segment-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="Preview Only"
          >
            <Eye size={14} />
            <span className="docforge-segment-label">Preview</span>
          </button>
        </div>
      </div>

      {/* Right: Actions and Settings */}
      <div className="docforge-header-right">
        <div className="docforge-header-desktop-actions">
          <button
            type="button"
            className="docforge-btn docforge-btn-ai"
            onClick={() => setIsAIModalOpen(true)}
            title="Open AI Document Assistant (Transform, Summarize, Tone, Polish)"
          >
            <Sparkles size={15} />
            <span>AI Assist</span>
          </button>

          <button
            type="button"
            className="docforge-btn docforge-btn-ghost"
            onClick={() => setIsTemplateModalOpen(true)}
            title="Browse document templates and presets"
          >
            <LayoutTemplate size={15} />
            <span>Templates</span>
          </button>

          <button
            type="button"
            className="docforge-btn docforge-btn-ghost"
            onClick={() => setIsWorkspaceOpen(true)}
            title="Open Local Document Workspace (Manage / Search Saved Documents)"
          >
            <Folder size={15} />
            <span>Workspace</span>
          </button>

          <button
            type="button"
            className={`docforge-btn docforge-btn-ghost ${isSettingsOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            title="Document Settings"
            aria-expanded={isSettingsOpen}
          >
            <Sliders size={15} />
            <span>Settings</span>
          </button>

          {/* Export PDF Button & Split Dropdown */}
          <div className="docforge-export-split-btn">
            <button
              type="button"
              className={`docforge-btn docforge-btn-primary ${exportState === 'exporting' ? 'disabled' : ''}`}
              onClick={handleExportPdf}
              disabled={exportState === 'exporting'}
              title="Download PDF Document"
            >
              {exportState === 'exporting' && <RefreshCw size={15} className="spin" />}
              {exportState === 'success' && <CheckCircle2 size={15} />}
              {exportState === 'error' && <AlertCircle size={15} />}
              {exportState === 'idle' && <Download size={15} />}
              <span>
                {exportState === 'exporting'
                  ? 'Generating PDF…'
                  : exportState === 'success'
                  ? 'Downloaded!'
                  : exportState === 'error'
                  ? 'Export Error'
                  : 'Export PDF'}
              </span>
            </button>

            <button
              type="button"
              className="docforge-export-menu-arrow"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              aria-label="Export Options"
              aria-expanded={isExportMenuOpen}
            >
              <ChevronDown size={14} />
            </button>

            {isExportMenuOpen && (
              <div className="docforge-export-dropdown-menu">
                <button
                  type="button"
                  className="docforge-export-dropdown-item"
                  onClick={handleExportPdf}
                >
                  <Download size={14} />
                  <div>
                    <div className="docforge-export-title">Download PDF File</div>
                    <div className="docforge-export-sub">Generates and saves .pdf document</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="docforge-export-dropdown-item"
                  onClick={handlePrint}
                >
                  <Printer size={14} />
                  <div>
                    <div className="docforge-export-title">Print / Vector PDF</div>
                    <div className="docforge-export-sub">Open system print dialog with @page styling</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          className="docforge-mobile-toggle"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="docforge-mobile-menu">
          <button
            type="button"
            className="docforge-mobile-menu-item"
            onClick={() => {
              setIsAIModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
          >
            <Sparkles size={16} />
            <span>AI Document Assistant</span>
          </button>
          <button
            type="button"
            className="docforge-mobile-menu-item"
            onClick={() => {
              setIsWorkspaceOpen(true);
              setIsMobileMenuOpen(false);
            }}
          >
            <Folder size={16} />
            <span>Document Workspace</span>
          </button>
          <button
            type="button"
            className="docforge-mobile-menu-item"
            onClick={() => {
              setIsTemplateModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
          >
            <LayoutTemplate size={16} />
            <span>Document Templates</span>
          </button>
          <button
            type="button"
            className="docforge-mobile-menu-item"
            onClick={() => {
              loadSampleDocument();
              setIsMobileMenuOpen(false);
            }}
          >
            <Sparkles size={16} />
            <span>Load Sample Document</span>
          </button>
          <button
            type="button"
            className="docforge-mobile-menu-item"
            onClick={() => {
              handleNewDocument();
              setIsMobileMenuOpen(false);
            }}
          >
            <RotateCcw size={16} />
            <span>New Blank Document</span>
          </button>
          <button
            type="button"
            className="docforge-mobile-menu-item"
            onClick={() => {
              setIsSettingsOpen(true);
              setIsMobileMenuOpen(false);
            }}
          >
            <Sliders size={16} />
            <span>Document Settings</span>
          </button>
          <button
            type="button"
            className="docforge-mobile-menu-item primary"
            onClick={handleExportPdf}
            disabled={exportState === 'exporting'}
          >
            <Download size={16} />
            <span>{exportState === 'exporting' ? 'Generating PDF…' : 'Export PDF'}</span>
          </button>
          <button
            type="button"
            className="docforge-mobile-menu-item"
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>Print / Save via Browser</span>
          </button>
        </div>
      )}

      {/* Export Error Alert Toast */}
      {exportError && (
        <div className="docforge-toast-error" role="alert">
          <AlertCircle size={16} />
          <span>{exportError}</span>
          <button
            type="button"
            className="docforge-toast-close"
            onClick={() => setExportError(null)}
          >
            &times;
          </button>
        </div>
      )}
    </header>
  );
};
