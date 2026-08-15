import React, { useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Table,
  Link as LinkIcon,
  Minus,
  Upload,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  PenTool,
  RefreshCw,
  LayoutTemplate,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';

export const EditorPanel: React.FC = () => {
  const {
    document: doc,
    updateContent,
    loadSampleDocument,
    setIsTemplateModalOpen,
    loadFile,
  } = useDocument();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const applyFormatting = useCallback((prefix: string, suffix: string = '', defaultPlaceholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previous = doc.content;
    const hasSelection = start !== end;
    const selectedText = hasSelection ? previous.substring(start, end) : defaultPlaceholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = previous.substring(0, start) + replacement + previous.substring(end);

    updateContent(newContent);

    // Reposition cursor inside the formatted token
    setTimeout(() => {
      textarea.focus();
      if (hasSelection) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
      }
    }, 0);
  }, [doc.content, updateContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Shortcuts:
    // Ctrl+B -> Bold
    if (modKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      applyFormatting('**', '**', 'bold text');
      return;
    }

    // Ctrl+I -> Italic
    if (modKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      applyFormatting('*', '*', 'italic text');
      return;
    }

    // Ctrl+K -> Link
    if (modKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      applyFormatting('[', '](https://example.com)', 'link text');
      return;
    }

    // Ctrl+Shift+X -> Strikethrough
    if (modKey && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      applyFormatting('~~', '~~', 'strikethrough text');
      return;
    }

    // Tab -> Insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const previous = doc.content;

      if (!e.shiftKey) {
        // Indent
        const replacement = '  ';
        const newContent = previous.substring(0, start) + replacement + previous.substring(end);
        updateContent(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      }
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setImportWarnings([]);
    setIsImporting(true);

    try {
      const result = await loadFile(file);
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      } else if (result.warnings && result.warnings.length > 0) {
        setImportWarnings(result.warnings);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <section
      className={`docforge-editor-pane ${isDragOver ? 'drag-over' : ''}`}
      aria-label="Markdown Editor"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Editor Toolbar */}
      <div className="docforge-editor-toolbar">
        <div className="docforge-editor-toolbar-left">
          <div className="docforge-editor-tag">
            <FileCode size={13} />
            <span>
              {doc.sourceFormat === 'pdf'
                ? 'Reconstructed PDF Source'
                : doc.sourceFormat === 'docx'
                ? 'Imported Word (DOCX) Source'
                : doc.sourceFormat === 'html'
                ? 'Imported HTML Source'
                : doc.sourceFormat === 'plain-text'
                ? 'Plain Text Source'
                : 'Markdown Source'}
            </span>
          </div>

          <div className="docforge-toolbar-divider" />

          {/* Quick Syntax Helper Buttons */}
          <div className="docforge-editor-actions" role="toolbar" aria-label="Markdown Formatting Tools">
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('**', '**', 'bold text')}
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('*', '*', 'italic text')}
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('~~', '~~', 'strikethrough')}
              title="Strikethrough (Ctrl+Shift+X)"
              aria-label="Strikethrough"
            >
              <Strikethrough size={14} />
            </button>

            <div className="docforge-toolbar-divider" />

            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n# ', '\n', 'Heading 1')}
              title="Heading 1"
              aria-label="Heading 1"
            >
              <Heading1 size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n## ', '\n', 'Heading 2')}
              title="Heading 2"
              aria-label="Heading 2"
            >
              <Heading2 size={14} />
            </button>

            <div className="docforge-toolbar-divider" />

            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n- ', '\n', 'List item')}
              title="Unordered List"
              aria-label="Unordered List"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n1. ', '\n', 'Numbered item')}
              title="Ordered List"
              aria-label="Ordered List"
            >
              <ListOrdered size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n- [ ] ', '\n', 'Task item')}
              title="Task List"
              aria-label="Task List"
            >
              <CheckSquare size={14} />
            </button>

            <div className="docforge-toolbar-divider" />

            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n> ', '\n', 'Quote')}
              title="Blockquote"
              aria-label="Blockquote"
            >
              <Quote size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('`', '`', 'code')}
              title="Inline Code"
              aria-label="Inline Code"
            >
              <Code size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n```typescript\n', '\n```\n', 'console.log("Hello");')}
              title="Code Block"
              aria-label="Code Block"
            >
              <FileCode size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n', '', '')}
              title="Table"
              aria-label="Table"
            >
              <Table size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('[', '](https://example.com)', 'Link Title')}
              title="Link (Ctrl+K)"
              aria-label="Link"
            >
              <LinkIcon size={14} />
            </button>
            <button
              type="button"
              className="docforge-tool-btn"
              onClick={() => applyFormatting('\n---\n', '', '')}
              title="Horizontal Rule"
              aria-label="Horizontal Rule"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>

        <div className="docforge-editor-toolbar-right">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".md,.markdown,.txt,.pdf,.docx,.html,.htm,text/markdown,text/plain,application/pdf,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="docforge-tool-btn with-label"
            onClick={() => fileInputRef.current?.click()}
            title="Import or Upload .md, .txt, .pdf, .docx, or .html file"
          >
            <Upload size={13} />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Loading state during document import extraction */}
      {isImporting && (
        <div className="docforge-editor-loading-banner" role="status">
          <RefreshCw size={14} className="spin" />
          <span>Reading and reconstructing document content into editable format...</span>
        </div>
      )}

      {/* Error alert if file validation fails */}
      {errorMessage && (
        <div className="docforge-editor-alert" role="alert">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
          <button
            type="button"
            className="docforge-alert-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Warning banner for document import remarks */}
      {importWarnings.length > 0 && (
        <div className="docforge-editor-warning-banner" role="alert">
          <AlertTriangle size={15} />
          <div className="docforge-warning-content">
            {importWarnings.map((warn, i) => (
              <span key={i}>{warn}</span>
            ))}
          </div>
          <button
            type="button"
            className="docforge-alert-close"
            onClick={() => setImportWarnings([])}
            aria-label="Dismiss warning"
          >
            &times;
          </button>
        </div>
      )}

      {/* Editor Surface */}
      <div className="docforge-editor-container">
        {doc.content.length === 0 && (
          <div className="docforge-editor-empty-overlay">
            <div className="docforge-empty-icon">
              <PenTool size={32} />
            </div>
            <h3 className="docforge-empty-title">Ready to write or import document</h3>
            <p className="docforge-empty-desc">
              Start typing Markdown directly, drop a <code>.md</code>, <code>.txt</code>, <code>.pdf</code>, <code>.docx</code>, or <code>.html</code> file, or load a pre-configured template.
            </p>
            <div className="docforge-empty-actions">
              <button
                type="button"
                className="docforge-btn docforge-btn-primary"
                onClick={() => setIsTemplateModalOpen(true)}
              >
                <LayoutTemplate size={14} />
                <span>Choose Template</span>
              </button>
              <button
                type="button"
                className="docforge-btn docforge-btn-ghost"
                onClick={loadSampleDocument}
              >
                <Sparkles size={14} />
                <span>Sample Document</span>
              </button>
              <button
                type="button"
                className="docforge-btn docforge-btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Import File</span>
              </button>
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="docforge-textarea"
          value={doc.content}
          onChange={(e) => updateContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="# Document Title&#10;&#10;Start typing Markdown here..."
          spellCheck="false"
          aria-label="Markdown content input"
        />

        {/* Drag & Drop Visual Overlay */}
        {isDragOver && (
          <div className="docforge-drop-overlay">
            <Upload size={48} className="docforge-drop-icon" />
            <h3>Drop Markdown, Text, PDF, Word, or HTML file here</h3>
            <p>Supported formats: .md, .txt, .pdf, .docx, .html (up to 25MB)</p>
          </div>
        )}
      </div>
    </section>
  );
};
