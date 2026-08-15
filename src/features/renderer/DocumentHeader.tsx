import React from 'react';

interface DocumentHeaderProps {
  title: string;
  date?: string;
  customText?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, date, customText }) => {
  return (
    <header className="docforge-sheet-header" aria-label="Document Running Header">
      <span className="docforge-header-left-text">{customText || title}</span>
      <span className="docforge-header-right-text">{date || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
    </header>
  );
};
