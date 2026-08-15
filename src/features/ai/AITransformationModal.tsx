import React, { useState, useId } from 'react';
import {
  Sparkles,
  X,
  Check,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sliders,
  FileText,
  FileCode,
  ArrowRight,
  RefreshCw,
  Plus,
  Cpu,
  Globe,
  Key,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import {
  type AIOperationType,
  type AITone,
  type AISectionType,
  type AITransformationResult,
  type AIProviderConfig,
  type AIProviderType,
  PROVIDER_PRESETS,
} from '../../models/ai';
import { getAIProvider } from '../../lib/ai/aiProvider';
import { parseMarkdownToHtml } from '../../lib/parser/markdownParser';

interface OperationCardProps {
  id: AIOperationType;
  title: string;
  description: string;
  badge?: string;
  isSelected: boolean;
  onSelect: (op: AIOperationType) => void;
}

const OperationCard: React.FC<OperationCardProps> = ({
  id,
  title,
  description,
  badge,
  isSelected,
  onSelect,
}) => (
  <button
    type="button"
    className={`docforge-ai-op-card ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(id)}
  >
    <div className="docforge-ai-op-header">
      <span className="docforge-ai-op-title">{title}</span>
      {badge && <span className="docforge-ai-op-badge">{badge}</span>}
    </div>
    <p className="docforge-ai-op-desc">{description}</p>
  </button>
);

export const AITransformationModal: React.FC = () => {
  const {
    document: doc,
    isAIModalOpen,
    setIsAIModalOpen,
    aiConfig,
    updateAIConfig,
    applyAITransformation,
    undoAITransformation,
    canUndoAI,
  } = useDocument();

  const titleId = useId();

  const [selectedOp, setSelectedOp] = useState<AIOperationType>('improve-writing');
  const [selectedTone, setSelectedTone] = useState<AITone>('professional');
  const [selectedSectionType, setSelectedSectionType] = useState<AISectionType>('conclusion');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AITransformationResult | null>(null);
  const [previewTab, setPreviewTab] = useState<'formatted' | 'raw'>('formatted');

  // Provider configuration form state
  const [tempConfig, setTempConfig] = useState<AIProviderConfig>(aiConfig);

  if (!isAIModalOpen) return null;

  const handleClose = () => {
    setIsAIModalOpen(false);
    setResult(null);
    setError(null);
    setIsConfigOpen(false);
  };

  const handleSelectProviderType = (providerId: AIProviderType) => {
    const preset = PROVIDER_PRESETS[providerId] || PROVIDER_PRESETS.local;
    setTempConfig((prev) => ({
      ...prev,
      type: providerId,
      endpoint: preset.defaultEndpoint,
      model: preset.defaultModel,
    }));
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getAIProvider(aiConfig);
      const res = await provider.transform({
        operation: selectedOp,
        documentContent: doc.content,
        documentTitle: doc.title,
        tone: selectedOp === 'change-tone' ? selectedTone : undefined,
        sectionType: selectedOp === 'generate-section' ? selectedSectionType : undefined,
        customInstruction: customInstruction.trim() || undefined,
      });

      setResult(res);
    } catch (err) {
      console.error('AI execution failure:', err);
      setError(err instanceof Error ? err.message : 'AI transformation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (mode: 'replace' | 'insert' = 'replace') => {
    if (!result) return;
    applyAITransformation(result, mode);
    handleClose();
  };

  const handleUndo = () => {
    const success = undoAITransformation();
    if (success) {
      handleClose();
    }
  };

  const handleSaveConfig = () => {
    updateAIConfig(tempConfig);
    setIsConfigOpen(false);
  };

  const currentPreset = PROVIDER_PRESETS[tempConfig.type] || PROVIDER_PRESETS.local;
  const activePreset = PROVIDER_PRESETS[aiConfig.type] || PROVIDER_PRESETS.local;
  const renderedPreviewHtml = result ? parseMarkdownToHtml(result.transformedContent) : '';

  return (
    <div
      className="docforge-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="docforge-ai-modal">
        {/* Header */}
        <div className="docforge-ai-modal-header">
          <div className="docforge-ai-modal-title-box">
            <div className="docforge-ai-icon-badge">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 id={titleId} className="docforge-ai-title">
                AI Document Assistant
              </h2>
              <p className="docforge-ai-subtitle">
                Transform, structure, and polish documents using offline local rules or any AI provider.
              </p>
            </div>
          </div>

          <div className="docforge-ai-header-actions">
            <button
              type="button"
              className={`docforge-icon-btn ${isConfigOpen ? 'active' : ''}`}
              onClick={() => setIsConfigOpen((prev) => !prev)}
              title="Configure AI Provider (Local, OpenAI, Anthropic, Gemini, Groq, DeepSeek, Ollama)"
            >
              <Sliders size={16} />
            </button>
            <button
              type="button"
              className="docforge-modal-close"
              onClick={handleClose}
              aria-label="Close AI Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Universal Provider Config Drawer */}
        {isConfigOpen && (
          <div className="docforge-ai-config-drawer">
            <div className="docforge-ai-config-header">
              <span className="docforge-config-title">
                <Settings size={14} /> AI Provider Settings
              </span>
              <button
                type="button"
                className="docforge-btn docforge-btn-xs docforge-btn-primary"
                onClick={handleSaveConfig}
              >
                Save Settings
              </button>
            </div>

            <div className="docforge-ai-config-body">
              {/* Provider Preset Selector Grid */}
              <div className="docforge-config-row">
                <label>Select AI Provider</label>
                <div className="docforge-provider-grid">
                  {Object.values(PROVIDER_PRESETS).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`docforge-provider-preset-btn ${tempConfig.type === preset.id ? 'active' : ''}`}
                      onClick={() => handleSelectProviderType(preset.id)}
                    >
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-badge">{preset.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Connection Fields */}
              {tempConfig.type !== 'local' && (
                <div className="docforge-config-remote-fields">
                  <div className="docforge-config-field">
                    <label>
                      <Globe size={12} /> Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={tempConfig.endpoint || ''}
                      placeholder={currentPreset.defaultEndpoint}
                      onChange={(e) => setTempConfig((prev) => ({ ...prev, endpoint: e.target.value }))}
                    />
                  </div>

                  <div className="docforge-config-field">
                    <label>
                      <Key size={12} /> API Key {currentPreset.isKeyRequired ? '(Session Only)' : '(Optional)'}
                    </label>
                    <input
                      type="password"
                      value={tempConfig.apiKey || ''}
                      placeholder={currentPreset.placeholderKey}
                      onChange={(e) => setTempConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>

                  <div className="docforge-config-field">
                    <label>
                      <Cpu size={12} /> Model Name
                    </label>
                    <div className="docforge-model-input-box">
                      <input
                        type="text"
                        value={tempConfig.model || ''}
                        placeholder={currentPreset.defaultModel}
                        onChange={(e) => setTempConfig((prev) => ({ ...prev, model: e.target.value }))}
                      />
                      {currentPreset.models.length > 1 && (
                        <select
                          className="docforge-model-select"
                          value={tempConfig.model || ''}
                          onChange={(e) => setTempConfig((prev) => ({ ...prev, model: e.target.value }))}
                          aria-label="Preset models"
                        >
                          <option value="" disabled>Presets</option>
                          {currentPreset.models.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="docforge-ai-modal-body">
          {!result ? (
            /* Operation Setup State */
            <div className="docforge-ai-setup-view">
              <label className="docforge-section-label">Select Transformation</label>
              <div className="docforge-ai-op-list">
                <OperationCard
                  id="improve-writing"
                  title="Improve Writing"
                  description="Refine clarity, eliminate redundancies, and improve flow while preserving structure."
                  badge="Popular"
                  isSelected={selectedOp === 'improve-writing'}
                  onSelect={setSelectedOp}
                />
                <OperationCard
                  id="summarize"
                  title="Summarize Document"
                  description="Generate a high-level Executive Summary and bulleted Key Takeaways."
                  isSelected={selectedOp === 'summarize'}
                  onSelect={setSelectedOp}
                />
                <OperationCard
                  id="change-tone"
                  title="Change Tone"
                  description="Adapt document language to Professional, Academic, Concise, or Friendly style."
                  isSelected={selectedOp === 'change-tone'}
                  onSelect={setSelectedOp}
                />
                <OperationCard
                  id="expand"
                  title="Expand Content"
                  description="Elaborate on core points with deeper context and technical rationale."
                  isSelected={selectedOp === 'expand'}
                  onSelect={setSelectedOp}
                />
                <OperationCard
                  id="rewrite"
                  title="Rewrite & Modernize"
                  description="Rephrase repetitive sections to enhance eloquence and professional cadence."
                  isSelected={selectedOp === 'rewrite'}
                  onSelect={setSelectedOp}
                />
                <OperationCard
                  id="generate-section"
                  title="Generate Section"
                  description="Contextually generate missing sections like Conclusion, Methodology, or FAQ."
                  isSelected={selectedOp === 'generate-section'}
                  onSelect={setSelectedOp}
                />
                <OperationCard
                  id="improve-structure"
                  title="Improve Structure"
                  description="Normalize heading hierarchy (H1 -> H2 -> H3) and organize loose sections."
                  isSelected={selectedOp === 'improve-structure'}
                  onSelect={setSelectedOp}
                />
              </div>

              {/* Sub-options for specific operations */}
              {selectedOp === 'change-tone' && (
                <div className="docforge-ai-suboptions">
                  <label className="docforge-sub-label">Target Tone</label>
                  <div className="docforge-tone-grid">
                    {(['professional', 'academic', 'concise', 'friendly'] as AITone[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`docforge-tone-btn ${selectedTone === t ? 'active' : ''}`}
                        onClick={() => setSelectedTone(t)}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedOp === 'generate-section' && (
                <div className="docforge-ai-suboptions">
                  <label className="docforge-sub-label">Section to Generate</label>
                  <div className="docforge-section-type-grid">
                    {([
                      'introduction',
                      'executive-summary',
                      'methodology',
                      'recommendations',
                      'faq',
                      'conclusion',
                    ] as AISectionType[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`docforge-section-type-btn ${selectedSectionType === s ? 'active' : ''}`}
                        onClick={() => setSelectedSectionType(s)}
                      >
                        {s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="docforge-ai-custom-prompt">
                <label className="docforge-sub-label">Additional Instructions (Optional)</label>
                <input
                  type="text"
                  className="docforge-input"
                  placeholder="e.g., Focus on security aspects, keep bullet points brief..."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                />
              </div>

              {error && (
                <div className="docforge-ai-error-banner" role="alert">
                  <div className="docforge-ai-error-content">
                    <span className="docforge-ai-error-msg">{error}</span>
                    {aiConfig.type !== 'local' && (
                      <div className="docforge-ai-error-actions">
                        <button
                          type="button"
                          className="docforge-btn docforge-btn-xs docforge-btn-secondary"
                          onClick={() => {
                            updateAIConfig({ type: 'local', model: 'docforge-local-rules-v1' });
                            setError(null);
                          }}
                        >
                          <ShieldCheck size={12} /> Switch to Offline Local Engine
                        </button>
                        <button
                          type="button"
                          className="docforge-btn docforge-btn-xs docforge-btn-ghost"
                          onClick={() => {
                            setIsConfigOpen(true);
                            setError(null);
                          }}
                        >
                          <Settings size={12} /> Open Settings
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Review & Preview State */
            <div className="docforge-ai-review-view">
              <div className="docforge-ai-review-header">
                <div className="docforge-ai-review-meta">
                  <span className="docforge-ai-badge-success">
                    <Check size={12} /> Transformation Ready
                  </span>
                  <span className="docforge-ai-summary-text">{result.summaryOfChanges}</span>
                </div>

                <div className="docforge-ai-view-tabs">
                  <button
                    type="button"
                    className={`docforge-tab-btn ${previewTab === 'formatted' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('formatted')}
                  >
                    <FileText size={13} /> Formatted Document
                  </button>
                  <button
                    type="button"
                    className={`docforge-tab-btn ${previewTab === 'raw' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('raw')}
                  >
                    <FileCode size={13} /> Raw Markdown
                  </button>
                </div>
              </div>

              <div className="docforge-preview-container">
                {previewTab === 'formatted' ? (
                  <div
                    className="docforge-content docforge-review-html-preview"
                    dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                  />
                ) : (
                  <pre className="docforge-review-raw-markdown">{result.transformedContent}</pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="docforge-ai-modal-footer">
          <div className="docforge-footer-left">
            <div className="docforge-privacy-tag">
              <ShieldCheck size={14} className="privacy-icon" />
              <span>
                {activePreset.isLocal
                  ? `${activePreset.name} (${activePreset.badge})`
                  : `${activePreset.name} • ${aiConfig.model || activePreset.defaultModel}`}
              </span>
            </div>

            {canUndoAI && !result && (
              <button
                type="button"
                className="docforge-btn docforge-btn-ghost docforge-btn-xs"
                onClick={handleUndo}
                title="Revert to state prior to last AI transformation"
              >
                <RotateCcw size={12} /> Undo Last AI Edit
              </button>
            )}
          </div>

          <div className="docforge-footer-right">
            {result ? (
              <>
                <button
                  type="button"
                  className="docforge-btn docforge-btn-ghost"
                  onClick={() => setResult(null)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="docforge-btn docforge-btn-secondary"
                  onClick={() => handleApply('insert')}
                  title="Append or insert generated section into current document"
                >
                  <Plus size={14} /> Insert into Document
                </button>
                <button
                  type="button"
                  className="docforge-btn docforge-btn-primary"
                  onClick={() => handleApply('replace')}
                  title="Replace document content with transformed result"
                >
                  <Check size={14} /> Apply Changes
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="docforge-btn docforge-btn-ghost"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="docforge-btn docforge-btn-primary"
                  onClick={handleExecute}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Transforming...
                    </>
                  ) : (
                    <>
                      Transform with AI <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
