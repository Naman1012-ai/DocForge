import React from 'react';
import { DocumentProvider } from '../../context/DocumentContext';
import { Header } from './Header';
import { Workspace } from './Workspace';
import { StatusBar } from './StatusBar';
import { TemplateModal } from '../../features/templates/TemplateModal';
import { WorkspaceModal } from '../../features/workspace/WorkspaceModal';
import { AITransformationModal } from '../../features/ai/AITransformationModal';
import { PrintDocumentRoot } from '../../features/renderer/PrintDocumentRoot';
import { ErrorBoundary } from '../feedback/ErrorBoundary';

export const AppShell: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="DocForge Application Encountered a Problem">
      <DocumentProvider>
        {/* On-screen Interactive Application Shell */}
        <div className="docforge-app-shell">
          <Header />
          <Workspace />
          <StatusBar />
          <TemplateModal />
          <WorkspaceModal />
          <AITransformationModal />
        </div>

        {/* Dedicated, Isolated Document Print & Export Root */}
        <PrintDocumentRoot />
      </DocumentProvider>
    </ErrorBoundary>
  );
};
