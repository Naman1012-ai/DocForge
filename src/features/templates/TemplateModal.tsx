import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  BookOpen,
  Cpu,
  Briefcase,
  FileSpreadsheet,
  FileCheck,
  Users,
  Check,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import {
  BUILT_IN_TEMPLATES,
  TEMPLATE_LIST,
  type TemplateId,
  type TemplateCategory,
  type TemplateDefinition,
} from '../../models/template';
import { THEME_PRESETS } from '../../models/theme';

const CATEGORIES: Array<'All' | TemplateCategory> = [
  'All',
  'General',
  'Academic',
  'Engineering',
  'Business',
  'Productivity',
];

function getTemplateIcon(id: TemplateId) {
  switch (id) {
    case 'blank':
      return <FileText size={20} />;
    case 'academic-report':
      return <BookOpen size={20} />;
    case 'project-report':
      return <FileCheck size={20} />;
    case 'research-paper':
      return <Sparkles size={20} />;
    case 'technical-documentation':
      return <Cpu size={20} />;
    case 'business-report':
      return <Briefcase size={20} />;
    case 'proposal':
      return <FileSpreadsheet size={20} />;
    case 'meeting-notes':
      return <Users size={20} />;
    default:
      return <FileText size={20} />;
  }
}

export const TemplateModal: React.FC = () => {
  const { isTemplateModalOpen, setIsTemplateModalOpen, applyTemplate, document: doc } = useDocument();
  const [selectedCategory, setSelectedCategory] = useState<'All' | TemplateCategory>('All');
  const [activeTemplate, setActiveTemplate] = useState<TemplateDefinition>(BUILT_IN_TEMPLATES['academic-report']);
  const [showConfirmDirty, setShowConfirmDirty] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<TemplateId | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isTemplateModalOpen) {
      setShowConfirmDirty(false);
      setPendingTemplateId(null);
      // Auto focus modal
      setTimeout(() => firstButtonRef.current?.focus(), 50);
    }
  }, [isTemplateModalOpen]);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isTemplateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmDirty) {
          setShowConfirmDirty(false);
          setPendingTemplateId(null);
        } else {
          setIsTemplateModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTemplateModalOpen, showConfirmDirty, setIsTemplateModalOpen]);

  if (!isTemplateModalOpen) return null;

  const filteredTemplates = TEMPLATE_LIST.filter((tpl) => {
    if (selectedCategory === 'All') return true;
    return tpl.category === selectedCategory;
  });

  const handleSelectTemplate = (templateId: TemplateId) => {
    // If document has unsaved user edits, ask for confirmation inside modal
    if (doc.content.trim().length > 0 && doc.isDirty) {
      setPendingTemplateId(templateId);
      setShowConfirmDirty(true);
      return;
    }

    applyTemplate(templateId, false);
  };

  const handleConfirmApply = () => {
    if (pendingTemplateId) {
      applyTemplate(pendingTemplateId, false);
      setShowConfirmDirty(false);
      setPendingTemplateId(null);
    }
  };

  const recommendedThemeConfig = THEME_PRESETS[activeTemplate.recommendedTheme] || THEME_PRESETS.modern;

  return (
    <div
      className="docforge-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsTemplateModalOpen(false);
      }}
    >
      <div
        ref={modalRef}
        className="docforge-template-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="docforge-template-title"
      >
        {/* Modal Header */}
        <div className="docforge-template-modal-header">
          <div className="docforge-template-header-left">
            <h2 id="docforge-template-title">Choose a Document Template</h2>
            <p className="docforge-template-subtitle">
              Start with a structured preset tailored for research, engineering, business, or general writing.
            </p>
          </div>
          <button
            type="button"
            ref={firstButtonRef}
            className="docforge-modal-close"
            onClick={() => setIsTemplateModalOpen(false)}
            aria-label="Close template selector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Unsaved Changes Warning Banner */}
        {showConfirmDirty && pendingTemplateId && (
          <div className="docforge-template-dirty-banner" role="alert">
            <AlertTriangle size={18} />
            <div className="docforge-template-dirty-text">
              <strong>Unsaved edits in current document!</strong>
              <span>
                Applying &quot;{BUILT_IN_TEMPLATES[pendingTemplateId]?.name}&quot; will replace your current workspace content.
              </span>
            </div>
            <div className="docforge-template-dirty-actions">
              <button
                type="button"
                className="docforge-btn docforge-btn-danger"
                onClick={handleConfirmApply}
              >
                Replace &amp; Apply
              </button>
              <button
                type="button"
                className="docforge-btn docforge-btn-ghost"
                onClick={() => {
                  setShowConfirmDirty(false);
                  setPendingTemplateId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="docforge-template-categories" role="tablist" aria-label="Template Categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`docforge-category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Modal Body: Split Grid & Live Preview */}
        <div className="docforge-template-modal-body">
          {/* Left: Template Grid */}
          <div className="docforge-template-grid" role="list">
            {filteredTemplates.map((template) => {
              const isSelected = activeTemplate.id === template.id;
              return (
                <div
                  key={template.id}
                  role="listitem"
                  className={`docforge-template-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setActiveTemplate(template)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveTemplate(template);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="docforge-template-card-header">
                    <div className="docforge-template-icon-box">{getTemplateIcon(template.id)}</div>
                    <div className="docforge-template-badge">{template.badge}</div>
                  </div>

                  <h3 className="docforge-template-card-title">{template.name}</h3>
                  <p className="docforge-template-card-desc">{template.description}</p>

                  <div className="docforge-template-card-footer">
                    <span className="docforge-template-theme-hint">
                      Theme: <strong>{THEME_PRESETS[template.recommendedTheme]?.name}</strong>
                    </span>
                    <button
                      type="button"
                      className="docforge-template-use-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template.id);
                      }}
                      title={`Apply ${template.name}`}
                    >
                      Use
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Template Inspector & Details */}
          <div className="docforge-template-detail-pane">
            <div className="docforge-template-detail-header">
              <div className="docforge-template-detail-icon">{getTemplateIcon(activeTemplate.id)}</div>
              <div>
                <h3>{activeTemplate.name}</h3>
                <span className="docforge-template-detail-cat">{activeTemplate.category} Template</span>
              </div>
            </div>

            <p className="docforge-template-detail-desc">{activeTemplate.description}</p>

            <div className="docforge-template-specs">
              <div className="docforge-spec-row">
                <span>Default Theme:</span>
                <strong>{recommendedThemeConfig.name}</strong>
              </div>
              <div className="docforge-spec-row">
                <span>Page Format:</span>
                <strong>{(activeTemplate.defaultSettings.format || 'a4').toUpperCase()}</strong>
              </div>
              <div className="docforge-spec-row">
                <span>Margins:</span>
                <strong>{activeTemplate.defaultSettings.margins || 'Standard'}</strong>
              </div>
              <div className="docforge-spec-row">
                <span>Running Headers:</span>
                <strong>{activeTemplate.defaultSettings.showHeader ? 'Enabled' : 'Disabled'}</strong>
              </div>
            </div>

            <div className="docforge-template-outline">
              <h4>Structure Outline</h4>
              <div className="docforge-outline-preview">
                {activeTemplate.starterContent
                  .split('\n')
                  .filter((line) => line.startsWith('#') || line.startsWith('|') || line.startsWith('-'))
                  .slice(0, 7)
                  .map((line, idx) => (
                    <div key={idx} className="docforge-outline-line">
                      {line.replace(/^#+\s*/, '')}
                    </div>
                  ))}
              </div>
            </div>

            <div className="docforge-template-detail-actions">
              <button
                type="button"
                className="docforge-btn docforge-btn-primary full-width"
                onClick={() => handleSelectTemplate(activeTemplate.id)}
              >
                <Check size={16} />
                <span>Create with {activeTemplate.name}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
