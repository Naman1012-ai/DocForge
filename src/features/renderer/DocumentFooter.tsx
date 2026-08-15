import React from 'react';

interface DocumentFooterProps {
  pageNumber?: number;
  totalPages?: number;
  footerText?: string;
  showPageNumbers?: boolean;
  position?: 'left' | 'center' | 'right';
}

export const DocumentFooter: React.FC<DocumentFooterProps> = ({
  pageNumber = 1,
  totalPages = 1,
  footerText = 'DocForge Engine',
  showPageNumbers = true,
  position = 'right',
}) => {
  return (
    <footer className={`docforge-sheet-footer footer-pos-${position}`} aria-label="Document Running Footer">
      {position === 'left' && showPageNumbers && (
        <span className="docforge-footer-page-count">
          Page {pageNumber} of {totalPages}
        </span>
      )}
      <span className="docforge-footer-left-text">{footerText}</span>
      {position === 'center' && showPageNumbers && (
        <span className="docforge-footer-page-count footer-center">
          Page {pageNumber} of {totalPages}
        </span>
      )}
      {position === 'right' && showPageNumbers && (
        <span className="docforge-footer-page-count">
          Page {pageNumber} of {totalPages}
        </span>
      )}
    </footer>
  );
};
