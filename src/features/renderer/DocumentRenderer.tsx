import React, { useMemo } from 'react';
import type { PageSettings } from '../../models/settings';
import { type ThemeConfig, resolveThemeTokens } from '../../models/theme';
import { paginateDocumentHtml } from '../../lib/pagination/paginator';
import { DocumentPage } from './DocumentPage';

interface DocumentRendererProps {
  title: string;
  parsedHtml: string;
  settings: PageSettings;
  theme: ThemeConfig;
  className?: string;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  title,
  parsedHtml,
  settings,
  theme,
  className = '',
}) => {
  // Resolve effective theme tokens with user overrides (accent color, font scale, line spacing, paragraph/heading spacing)
  const effectiveTheme = useMemo(() => {
    return resolveThemeTokens(theme.id, settings);
  }, [theme.id, settings]);

  // Paginate document content into discrete physical page sheets
  const pages = useMemo(() => {
    return paginateDocumentHtml(parsedHtml, settings, effectiveTheme);
  }, [parsedHtml, settings, effectiveTheme]);

  return (
    <div className={`docforge-document-renderer ${className}`}>
      {pages.map((pageHtml, index) => {
        const isFirstPage = index === 0;
        const showHeader = settings.showHeader && !(settings.hideHeaderOnFirstPage && isFirstPage);

        return (
          <DocumentPage
            key={index}
            pageNumber={index + 1}
            totalPages={pages.length}
            title={title}
            showHeader={showHeader}
            showFooter={settings.showFooter}
            showPageNumbers={settings.showPageNumbers}
            headerText={settings.headerText}
            footerText={settings.footerText}
            pageNumberPosition={settings.pageNumberPosition}
            theme={effectiveTheme}
            settings={settings}
          >
            <div
              className="docforge-content"
              dangerouslySetInnerHTML={{ __html: pageHtml }}
            />
          </DocumentPage>
        );
      })}
    </div>
  );
};
