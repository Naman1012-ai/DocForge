import React from 'react';
import { useDocument } from '../../hooks/useDocument';
import { EditorPanel } from '../../features/editor/EditorPanel';
import { PreviewPanel } from '../../features/preview/PreviewPanel';
import { SettingsPanel } from '../../features/settings/SettingsPanel';
import { ErrorBoundary } from '../feedback/ErrorBoundary';

export const Workspace: React.FC = () => {
  const { viewMode, isSettingsOpen } = useDocument();

  return (
    <main className="docforge-workspace" role="main">
      <div className={`docforge-workspace-panes view-${viewMode}`}>
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className="docforge-pane docforge-pane-editor">
            <ErrorBoundary fallbackTitle="Editor encountered an unexpected error">
              <EditorPanel />
            </ErrorBoundary>
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="docforge-pane docforge-pane-preview">
            <ErrorBoundary fallbackTitle="Preview renderer encountered an unexpected error">
              <PreviewPanel />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Settings Side Drawer */}
      {isSettingsOpen && (
        <ErrorBoundary fallbackTitle="Settings encountered an error">
          <SettingsPanel />
        </ErrorBoundary>
      )}
    </main>
  );
};
