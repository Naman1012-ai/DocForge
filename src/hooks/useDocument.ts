import { useContext } from 'react';
import { DocumentContext, type DocumentContextType } from '../context/documentContextDefinition';

export const useDocument = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};
