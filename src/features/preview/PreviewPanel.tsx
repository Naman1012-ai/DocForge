import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import { THEME_PRESETS } from '../../models/theme';
import { DocumentRenderer } from '../renderer/DocumentRenderer';

export const PreviewPanel: React.FC = () => {
  const {
    document: doc,
    parsedHtml,
    zoomLevel,
    setZoomLevel,
    loadSampleDocument,
  } = useDocument();

  const activeTheme = THEME_PRESETS[doc.theme] || THEME_PRESETS.modern;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Estimate page count for toolbar metric
  const textLength = parsedHtml.replace(/<[^>]*>/g, '').length;
  const estimatedPages = Math.max(1, Math.ceil(textLength / 2600));

  return (
    <section className="docforge-preview-pane" aria-label="Document Preview">
      {/* Preview Toolbar */}
      <div className="docforge-preview-toolbar">
        <div className="docforge-preview-toolbar-left">
          <div className="docforge-preview-tag">
            <FileText size={13} />
            <span>Document Preview</span>
          </div>

          <div className="docforge-toolbar-divider" />

          <span className="docforge-page-metrics">
            {doc.settings.format.toUpperCase()} ({doc.settings.orientation}) • {activeTheme.name} • {estimatedPages} {estimatedPages === 1 ? 'page' : 'pages'}
          </span>
        </div>

        <div className="docforge-preview-toolbar-right">
          {/* Zoom Controls */}
          <div className="docforge-zoom-control">
            <button
              type="button"
              className="docforge-zoom-btn"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>

            <button
              type="button"
              className="docforge-zoom-value"
              onClick={handleZoomReset}
              title="Reset Zoom to 100%"
            >
              {zoomLevel}%
            </button>

            <button
              type="button"
              className="docforge-zoom-btn"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 150}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={13} />
            </button>

            <button
              type="button"
              className="docforge-zoom-btn"
              onClick={handleZoomReset}
              title="Fit to Width"
              aria-label="Fit to Width"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="docforge-preview-viewport">
        {doc.content.trim().length === 0 ? (
          <div className="docforge-preview-empty">
            <div className="docforge-empty-icon">
              <FileText size={40} />
            </div>
            <h3 className="docforge-empty-title">Document Preview is Empty</h3>
            <p className="docforge-empty-desc">
              Start writing in the editor or choose a template to begin formatting your PDF.
            </p>
            <button
              type="button"
              className="docforge-btn docforge-btn-primary"
              onClick={loadSampleDocument}
            >
              Load Sample Document
            </button>
          </div>
        ) : (
          <div
            className="docforge-sheet-scaler"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <DocumentRenderer
              title={doc.title}
              parsedHtml={parsedHtml}
              settings={doc.settings}
              theme={activeTheme}
            />
          </div>
        )}
      </div>
    </section>
  );
};
