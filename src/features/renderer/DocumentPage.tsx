import React, { type ReactNode, type CSSProperties } from 'react';
import type { ThemeConfig } from '../../models/theme';
import type { PageSettings } from '../../models/settings';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';

interface DocumentPageProps {
  children: ReactNode;
  pageNumber: number;
  totalPages: number;
  title: string;
  showHeader: boolean;
  showFooter: boolean;
  showPageNumbers: boolean;
  headerText?: string;
  footerText?: string;
  pageNumberPosition?: 'left' | 'center' | 'right';
  theme: ThemeConfig;
  settings: PageSettings;
}

export const DocumentPage: React.FC<DocumentPageProps> = ({
  children,
  pageNumber,
  totalPages,
  title,
  showHeader,
  showFooter,
  showPageNumbers,
  headerText,
  footerText,
  pageNumberPosition = 'right',
  theme,
  settings,
}) => {
  const fontFamilyStyle =
    theme.fontFamily === 'serif'
      ? 'Georgia, "Times New Roman", Cambria, serif'
      : theme.fontFamily === 'mono'
      ? 'var(--font-mono)'
      : 'var(--font-ui)';

  const headingFontFamilyStyle =
    theme.headingFontFamily === 'serif'
      ? 'Georgia, "Times New Roman", Cambria, serif'
      : theme.headingFontFamily === 'mono'
      ? 'var(--font-mono)'
      : 'var(--font-ui)';

  let marginTop = '25mm';
  let marginRight = '25mm';
  let marginBottom = '25mm';
  let marginLeft = '25mm';

  if (settings.margins === 'compact') {
    marginTop = marginRight = marginBottom = marginLeft = '15mm';
  } else if (settings.margins === 'relaxed') {
    marginTop = marginRight = marginBottom = marginLeft = '35mm';
  } else if (settings.margins === 'custom' && settings.customMargins) {
    marginTop = `${settings.customMargins.top}mm`;
    marginRight = `${settings.customMargins.right}mm`;
    marginBottom = `${settings.customMargins.bottom}mm`;
    marginLeft = `${settings.customMargins.left}mm`;
  }

  const dynamicStyles: CSSProperties & Record<string, string | number> = {
    fontFamily: fontFamilyStyle,
    fontSize: theme.bodyFontSize,
    lineHeight: theme.bodyLineHeight,
    textAlign: settings.textAlignment === 'justify' ? 'justify' : 'left',
    paddingTop: marginTop,
    paddingRight: marginRight,
    paddingBottom: marginBottom,
    paddingLeft: marginLeft,
    '--doc-primary': theme.primaryColor,
    '--doc-accent': theme.accentColor,
    '--doc-text': theme.textColor,
    '--doc-text-secondary': theme.secondaryTextColor,
    '--doc-heading': theme.headingColor,
    '--doc-heading-font': headingFontFamilyStyle,
    '--doc-heading-weight': theme.headingWeight,
    '--doc-title-align': theme.titleAlignment,
    '--doc-border': theme.borderColor,
    '--doc-code-bg': theme.codeBgColor,
    '--doc-code-text': theme.codeTextColor,
    '--doc-code-border': theme.codeBorderColor,
    '--doc-accent-bar': theme.accentBarColor,
    '--doc-table-header-bg': theme.tableHeaderBg,
    '--doc-table-border': theme.tableBorderColor,
    '--doc-quote-bg': theme.quoteBgColor,
    '--doc-quote-text': theme.quoteTextColor,
    '--doc-paragraph-margin': theme.paragraphMarginBottom,
    '--doc-heading-margin-top': theme.headingMarginTop,
    '--doc-heading-margin-bottom': theme.headingMarginBottom,
  };

  return (
    <article
      className={`docforge-sheet docforge-theme-${theme.id} docforge-table-${theme.tableStyle} docforge-quote-${theme.quoteStyle} docforge-format-${settings.format} docforge-orientation-${settings.orientation} docforge-table-density-${settings.tableDensity || 'standard'}`}
      data-page-number={pageNumber}
      style={dynamicStyles}
      aria-label={`Document Page ${pageNumber}`}
    >
      {showHeader && (
        <DocumentHeader
          title={title}
          customText={headerText}
        />
      )}

      <div className="docforge-content-area">
        {children}
      </div>

      {showFooter && (
        <DocumentFooter
          pageNumber={pageNumber}
          totalPages={totalPages}
          footerText={footerText}
          showPageNumbers={showPageNumbers}
          position={pageNumberPosition}
        />
      )}
    </article>
  );
};
