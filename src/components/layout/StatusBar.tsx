import React from 'react';
import { ShieldCheck, Layout, Type, Palette } from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import { THEME_PRESETS } from '../../models/theme';

export const StatusBar: React.FC = () => {
  const { document: doc } = useDocument();
  const activeTheme = THEME_PRESETS[doc.theme] || THEME_PRESETS.modern;

  return (
    <footer className="docforge-statusbar" role="contentinfo">
      <div className="docforge-statusbar-left">
        <div className="docforge-status-item" title="Document Page Geometry">
          <Layout size={13} />
          <span>
            {doc.settings.format.toUpperCase()} • {doc.settings.orientation} • {doc.settings.margins} margins
          </span>
        </div>

        <div className="docforge-statusbar-separator" />

        <div className="docforge-status-item" title="Active Document Theme">
          <Palette size={13} />
          <span>{activeTheme.name}</span>
        </div>
      </div>

      <div className="docforge-statusbar-right">
        <div className="docforge-status-item" title="Document Statistics">
          <Type size={13} />
          <span>
            {doc.metadata.wordCount.toLocaleString()} words • {doc.metadata.lineCount.toLocaleString()} lines • {doc.metadata.charCount.toLocaleString()} chars
          </span>
        </div>

        <div className="docforge-statusbar-separator" />

        <div className="docforge-status-item privacy" title="100% Local Browser Execution">
          <ShieldCheck size={14} className="privacy-icon" />
          <span>Local & Private</span>
        </div>
      </div>
    </footer>
  );
};
