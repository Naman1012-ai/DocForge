import React, { useMemo } from 'react';
import { useDocument } from '../../hooks/useDocument';
import { THEME_PRESETS } from '../../models/theme';
import { DocumentRenderer } from './DocumentRenderer';

/**
 * Authoritative, isolated document print root.
 * Renders ONLY the document sheets for native browser printing (window.print())
 * and vector/canvas PDF export, completely isolated from application UI chrome.
 */
export const PrintDocumentRoot: React.FC = () => {
  const { document: doc, parsedHtml } = useDocument();
  const activeTheme = useMemo(() => {
    return THEME_PRESETS[doc.theme] || THEME_PRESETS.modern;
  }, [doc.theme]);

  // Derive exact CSS @page size directive matching document format and orientation
  const pageCssSize = useMemo(() => {
    const isLetter = doc.settings.format === 'letter';
    const isLegal = doc.settings.format === 'legal';
    const isLandscape = doc.settings.orientation === 'landscape';

    if (isLandscape) {
      if (isLetter) return '11in 8.5in';
      if (isLegal) return '14in 8.5in';
      return '297mm 210mm';
    } else {
      if (isLetter) return '8.5in 11in';
      if (isLegal) return '8.5in 14in';
      return '210mm 297mm';
    }
  }, [doc.settings.format, doc.settings.orientation]);

  if (!doc.content || doc.content.trim().length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @page {
          size: ${pageCssSize};
          margin: 0;
        }
      `}</style>
      <div id="document-print-root" className="docforge-print-root" aria-hidden="true">
        <DocumentRenderer
          title={doc.title}
          parsedHtml={parsedHtml}
          settings={doc.settings}
          theme={activeTheme}
        />
      </div>
    </>
  );
};
