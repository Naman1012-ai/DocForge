import React, { useState } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Palette,
  Type,
  Layout,
  FileSpreadsheet,
  AlignLeft,
  AlignJustify,
  FileText,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import {
  type PageFormat,
  type PageOrientation,
  type MarginSize,
  type FontSizeScale,
  type LineSpacingOption,
  type ParagraphSpacingOption,
  type HeadingSpacingOption,
  type TextAlignmentOption,
  type PageNumberPosition,
  type TableDensity,
  DEFAULT_PAGE_SETTINGS,
} from '../../models/settings';
import { type ThemeId, THEME_PRESETS } from '../../models/theme';
import { isValidHexColor, normalizeHexColor, hasReadableContrast } from '../../utils/color';

const ACCENT_COLOR_SWATCHES = [
  { name: 'Indigo', hex: '#2563eb' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Crimson', hex: '#be123c' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Charcoal', hex: '#0f172a' },
];

export const SettingsPanel: React.FC = () => {
  const {
    document: doc,
    isSettingsOpen,
    setIsSettingsOpen,
    updateSettings,
    updateTheme,
  } = useDocument();

  const [customColorInput, setCustomColorInput] = useState(doc.settings.customAccentColor || '');
  const [colorError, setColorError] = useState<string | null>(null);

  // Custom margin local state
  const [customTop, setCustomTop] = useState(doc.settings.customMargins?.top ?? 25);
  const [customRight, setCustomRight] = useState(doc.settings.customMargins?.right ?? 25);
  const [customBottom, setCustomBottom] = useState(doc.settings.customMargins?.bottom ?? 25);
  const [customLeft, setCustomLeft] = useState(doc.settings.customMargins?.left ?? 25);

  // Close drawer on Escape
  React.useEffect(() => {
    if (!isSettingsOpen) return;
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isSettingsOpen, setIsSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleCustomColorChange = (hex: string) => {
    setCustomColorInput(hex);
    if (!hex) {
      setColorError(null);
      updateSettings({ customAccentColor: undefined });
      return;
    }

    if (!isValidHexColor(hex)) {
      setColorError('Enter a valid 3 or 6-digit hex color (e.g. #2563eb)');
      return;
    }

    const normalized = normalizeHexColor(hex);
    if (!hasReadableContrast(normalized)) {
      setColorError('Notice: Color has lower contrast on white paper.');
    } else {
      setColorError(null);
    }

    updateSettings({ customAccentColor: normalized });
  };

  const handleSwatchSelect = (hex: string) => {
    setCustomColorInput(hex);
    setColorError(null);
    updateSettings({ customAccentColor: hex });
  };

  const handleResetAccent = () => {
    setCustomColorInput('');
    setColorError(null);
    updateSettings({ customAccentColor: undefined });
  };

  const handleApplyCustomMargins = (top: number, right: number, bottom: number, left: number) => {
    const clampedTop = Math.max(8, Math.min(50, top || 25));
    const clampedRight = Math.max(8, Math.min(50, right || 25));
    const clampedBottom = Math.max(8, Math.min(50, bottom || 25));
    const clampedLeft = Math.max(8, Math.min(50, left || 25));

    setCustomTop(clampedTop);
    setCustomRight(clampedRight);
    setCustomBottom(clampedBottom);
    setCustomLeft(clampedLeft);

    updateSettings({
      margins: 'custom',
      customMargins: {
        top: clampedTop,
        right: clampedRight,
        bottom: clampedBottom,
        left: clampedLeft,
      },
    });
  };

  const handleResetAllSettings = () => {
    updateSettings({ ...DEFAULT_PAGE_SETTINGS });
    setCustomColorInput('');
    setColorError(null);
  };

  return (
    <aside className="docforge-settings-drawer" aria-label="Document Design & Layout Settings">
      <div className="docforge-settings-header">
        <div>
          <h2 className="docforge-settings-title">Layout &amp; Design Settings</h2>
          <p className="docforge-settings-subtitle">Precise page geometry, typography, and structure controls</p>
        </div>
        <button
          type="button"
          className="docforge-icon-btn"
          onClick={() => setIsSettingsOpen(false)}
          title="Close Settings"
          aria-label="Close Settings"
        >
          <X size={18} />
        </button>
      </div>

      <div className="docforge-settings-body">
        {/* SECTION 1: Document Theme Presets */}
        <section className="docforge-settings-section">
          <div className="docforge-section-header-row">
            <label className="docforge-settings-label">Document Theme</label>
          </div>
          <div className="docforge-theme-cards">
            {(Object.keys(THEME_PRESETS) as ThemeId[]).map((themeKey) => {
              const theme = THEME_PRESETS[themeKey];
              const isSelected = doc.theme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  className={`docforge-theme-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => updateTheme(themeKey)}
                >
                  <div className="docforge-theme-card-header">
                    <div
                      className="docforge-theme-swatch"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span className="docforge-theme-name">{theme.name}</span>
                    {isSelected && <Check size={14} className="docforge-theme-check" />}
                  </div>
                  <p className="docforge-theme-desc">{theme.description}</p>
                  <div className="docforge-theme-preview-badge">
                    <span>{theme.fontFamily === 'serif' ? 'Serif Heading' : theme.fontFamily === 'mono' ? 'Monospace' : 'Clean Sans'}</span>
                    <span>•</span>
                    <span>{theme.sampleSubtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Accent Color */}
        <section className="docforge-settings-section">
          <div className="docforge-section-header-row">
            <label className="docforge-settings-label">
              <Palette size={12} />
              <span>Accent Color</span>
            </label>
            {doc.settings.customAccentColor && (
              <button
                type="button"
                className="docforge-btn-reset-accent"
                onClick={handleResetAccent}
                title="Reset to theme default color"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="docforge-color-swatches">
            {ACCENT_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                className={`docforge-color-swatch-btn ${doc.settings.customAccentColor === swatch.hex ? 'active' : ''}`}
                style={{ backgroundColor: swatch.hex }}
                onClick={() => handleSwatchSelect(swatch.hex)}
                title={swatch.name}
              />
            ))}
          </div>

          <div className="docforge-color-input-row">
            <input
              type="text"
              className="docforge-hex-input"
              placeholder="#2563eb"
              value={customColorInput}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              maxLength={7}
            />
            {doc.settings.customAccentColor && (
              <div
                className="docforge-color-active-swatch"
                style={{ backgroundColor: doc.settings.customAccentColor }}
              />
            )}
          </div>
          {colorError && <div className="docforge-color-error">{colorError}</div>}
        </section>

        {/* SECTION 3: Page Geometry (Size, Orientation, Margins) */}
        <section className="docforge-settings-section">
          <div className="docforge-section-header-row">
            <label className="docforge-settings-label">
              <Layout size={12} />
              <span>Page Geometry</span>
            </label>
          </div>

          {/* Page Format */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Paper Size</span>
            <div className="docforge-button-group three-col">
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.format === 'a4' ? 'active' : ''}`}
                onClick={() => updateSettings({ format: 'a4' as PageFormat })}
              >
                <span>A4</span>
                {doc.settings.format === 'a4' && <Check size={13} />}
              </button>
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.format === 'letter' ? 'active' : ''}`}
                onClick={() => updateSettings({ format: 'letter' as PageFormat })}
              >
                <span>Letter</span>
                {doc.settings.format === 'letter' && <Check size={13} />}
              </button>
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.format === 'legal' ? 'active' : ''}`}
                onClick={() => updateSettings({ format: 'legal' as PageFormat })}
              >
                <span>Legal</span>
                {doc.settings.format === 'legal' && <Check size={13} />}
              </button>
            </div>
          </div>

          {/* Orientation */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Orientation</span>
            <div className="docforge-button-group">
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.orientation === 'portrait' ? 'active' : ''}`}
                onClick={() => updateSettings({ orientation: 'portrait' as PageOrientation })}
              >
                <span>Portrait</span>
                {doc.settings.orientation === 'portrait' && <Check size={13} />}
              </button>
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.orientation === 'landscape' ? 'active' : ''}`}
                onClick={() => updateSettings({ orientation: 'landscape' as PageOrientation })}
              >
                <span>Landscape</span>
                {doc.settings.orientation === 'landscape' && <Check size={13} />}
              </button>
            </div>
          </div>

          {/* Margins */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Margins</span>
            <div className="docforge-button-group four-col">
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.margins === 'compact' ? 'active' : ''}`}
                onClick={() => updateSettings({ margins: 'compact' as MarginSize })}
              >
                <span>Compact</span>
              </button>
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.margins === 'standard' ? 'active' : ''}`}
                onClick={() => updateSettings({ margins: 'standard' as MarginSize })}
              >
                <span>Standard</span>
              </button>
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.margins === 'relaxed' ? 'active' : ''}`}
                onClick={() => updateSettings({ margins: 'relaxed' as MarginSize })}
              >
                <span>Relaxed</span>
              </button>
              <button
                type="button"
                className={`docforge-option-btn ${doc.settings.margins === 'custom' ? 'active' : ''}`}
                onClick={() => handleApplyCustomMargins(customTop, customRight, customBottom, customLeft)}
              >
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Custom Margin Numeric Controls */}
          {doc.settings.margins === 'custom' && (
            <div className="docforge-custom-margins-grid">
              <div className="docforge-margin-input-box">
                <label>Top (mm)</label>
                <input
                  type="number"
                  min={8}
                  max={50}
                  value={customTop}
                  onChange={(e) => handleApplyCustomMargins(parseInt(e.target.value, 10), customRight, customBottom, customLeft)}
                />
              </div>
              <div className="docforge-margin-input-box">
                <label>Right (mm)</label>
                <input
                  type="number"
                  min={8}
                  max={50}
                  value={customRight}
                  onChange={(e) => handleApplyCustomMargins(customTop, parseInt(e.target.value, 10), customBottom, customLeft)}
                />
              </div>
              <div className="docforge-margin-input-box">
                <label>Bottom (mm)</label>
                <input
                  type="number"
                  min={8}
                  max={50}
                  value={customBottom}
                  onChange={(e) => handleApplyCustomMargins(customTop, customRight, parseInt(e.target.value, 10), customLeft)}
                />
              </div>
              <div className="docforge-margin-input-box">
                <label>Left (mm)</label>
                <input
                  type="number"
                  min={8}
                  max={50}
                  value={customLeft}
                  onChange={(e) => handleApplyCustomMargins(customTop, customRight, customBottom, parseInt(e.target.value, 10))}
                />
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: Typography & Spacing */}
        <section className="docforge-settings-section">
          <div className="docforge-section-header-row">
            <label className="docforge-settings-label">
              <Type size={12} />
              <span>Typography &amp; Spacing</span>
            </label>
          </div>

          {/* Font Size Scale */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Font Scale</span>
            <div className="docforge-segmented-button-group">
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.fontSizeScale === 'compact' ? 'active' : ''}`}
                onClick={() => updateSettings({ fontSizeScale: 'compact' as FontSizeScale })}
              >
                <span>Compact</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.fontSizeScale === 'standard' ? 'active' : ''}`}
                onClick={() => updateSettings({ fontSizeScale: 'standard' as FontSizeScale })}
              >
                <span>Standard</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.fontSizeScale === 'large' ? 'active' : ''}`}
                onClick={() => updateSettings({ fontSizeScale: 'large' as FontSizeScale })}
              >
                <span>Large</span>
              </button>
            </div>
          </div>

          {/* Line Spacing */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Line Spacing</span>
            <div className="docforge-segmented-button-group">
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.lineSpacing === 'compact' ? 'active' : ''}`}
                onClick={() => updateSettings({ lineSpacing: 'compact' as LineSpacingOption })}
              >
                <span>Compact</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.lineSpacing === 'standard' ? 'active' : ''}`}
                onClick={() => updateSettings({ lineSpacing: 'standard' as LineSpacingOption })}
              >
                <span>Standard</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.lineSpacing === 'relaxed' ? 'active' : ''}`}
                onClick={() => updateSettings({ lineSpacing: 'relaxed' as LineSpacingOption })}
              >
                <span>Relaxed</span>
              </button>
            </div>
          </div>

          {/* Paragraph Spacing */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Paragraph Spacing</span>
            <div className="docforge-segmented-button-group">
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.paragraphSpacing === 'compact' ? 'active' : ''}`}
                onClick={() => updateSettings({ paragraphSpacing: 'compact' as ParagraphSpacingOption })}
              >
                <span>Tight</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${(!doc.settings.paragraphSpacing || doc.settings.paragraphSpacing === 'standard') ? 'active' : ''}`}
                onClick={() => updateSettings({ paragraphSpacing: 'standard' as ParagraphSpacingOption })}
              >
                <span>Normal</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.paragraphSpacing === 'spacious' ? 'active' : ''}`}
                onClick={() => updateSettings({ paragraphSpacing: 'spacious' as ParagraphSpacingOption })}
              >
                <span>Spacious</span>
              </button>
            </div>
          </div>

          {/* Heading Spacing */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Heading Spacing</span>
            <div className="docforge-segmented-button-group">
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.headingSpacing === 'compact' ? 'active' : ''}`}
                onClick={() => updateSettings({ headingSpacing: 'compact' as HeadingSpacingOption })}
              >
                <span>Compact</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${(!doc.settings.headingSpacing || doc.settings.headingSpacing === 'standard') ? 'active' : ''}`}
                onClick={() => updateSettings({ headingSpacing: 'standard' as HeadingSpacingOption })}
              >
                <span>Standard</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.headingSpacing === 'spacious' ? 'active' : ''}`}
                onClick={() => updateSettings({ headingSpacing: 'spacious' as HeadingSpacingOption })}
              >
                <span>Spacious</span>
              </button>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Text Alignment</span>
            <div className="docforge-segmented-button-group">
              <button
                type="button"
                className={`docforge-seg-btn ${(!doc.settings.textAlignment || doc.settings.textAlignment === 'left') ? 'active' : ''}`}
                onClick={() => updateSettings({ textAlignment: 'left' as TextAlignmentOption })}
              >
                <AlignLeft size={13} />
                <span>Left</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.textAlignment === 'justify' ? 'active' : ''}`}
                onClick={() => updateSettings({ textAlignment: 'justify' as TextAlignmentOption })}
              >
                <AlignJustify size={13} />
                <span>Justified</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 5: Header, Footer & Page Numbers */}
        <section className="docforge-settings-section">
          <div className="docforge-section-header-row">
            <label className="docforge-settings-label">
              <FileText size={12} />
              <span>Headers, Footers &amp; Numbers</span>
            </label>
          </div>

          <label className="docforge-checkbox-row">
            <input
              type="checkbox"
              checked={doc.settings.showPageNumbers}
              onChange={(e) => updateSettings({ showPageNumbers: e.target.checked })}
            />
            <span>Show Page Numbers in Footer</span>
          </label>

          {doc.settings.showPageNumbers && (
            <div className="docforge-control-subrow indent">
              <span className="docforge-subrow-label">Number Position</span>
              <div className="docforge-segmented-button-group">
                <button
                  type="button"
                  className={`docforge-seg-btn ${doc.settings.pageNumberPosition === 'left' ? 'active' : ''}`}
                  onClick={() => updateSettings({ pageNumberPosition: 'left' as PageNumberPosition })}
                >
                  <span>Left</span>
                </button>
                <button
                  type="button"
                  className={`docforge-seg-btn ${doc.settings.pageNumberPosition === 'center' ? 'active' : ''}`}
                  onClick={() => updateSettings({ pageNumberPosition: 'center' as PageNumberPosition })}
                >
                  <span>Center</span>
                </button>
                <button
                  type="button"
                  className={`docforge-seg-btn ${(!doc.settings.pageNumberPosition || doc.settings.pageNumberPosition === 'right') ? 'active' : ''}`}
                  onClick={() => updateSettings({ pageNumberPosition: 'right' as PageNumberPosition })}
                >
                  <span>Right</span>
                </button>
              </div>
            </div>
          )}

          <label className="docforge-checkbox-row">
            <input
              type="checkbox"
              checked={doc.settings.showHeader}
              onChange={(e) => updateSettings({ showHeader: e.target.checked })}
            />
            <span>Include Running Document Header</span>
          </label>

          {doc.settings.showHeader && (
            <div className="docforge-control-subrow indent">
              <label className="docforge-checkbox-row sub">
                <input
                  type="checkbox"
                  checked={doc.settings.hideHeaderOnFirstPage ?? false}
                  onChange={(e) => updateSettings({ hideHeaderOnFirstPage: e.target.checked })}
                />
                <span>Hide Header on First Page (Cover / Title Page)</span>
              </label>
              <input
                type="text"
                className="docforge-text-setting-input"
                placeholder="Custom Header Text (defaults to title)"
                value={doc.settings.headerText || ''}
                onChange={(e) => updateSettings({ headerText: e.target.value })}
              />
            </div>
          )}

          <label className="docforge-checkbox-row">
            <input
              type="checkbox"
              checked={doc.settings.showFooter}
              onChange={(e) => updateSettings({ showFooter: e.target.checked })}
            />
            <span>Include Running Document Footer</span>
          </label>

          {doc.settings.showFooter && (
            <div className="docforge-control-subrow indent">
              <input
                type="text"
                className="docforge-text-setting-input"
                placeholder="Custom Footer Text (e.g. Confidential)"
                value={doc.settings.footerText || ''}
                onChange={(e) => updateSettings({ footerText: e.target.value })}
              />
            </div>
          )}
        </section>

        {/* SECTION 6: Element Presentation */}
        <section className="docforge-settings-section">
          <div className="docforge-section-header-row">
            <label className="docforge-settings-label">
              <FileSpreadsheet size={12} />
              <span>Table Presentation</span>
            </label>
          </div>

          <div className="docforge-control-subrow">
            <span className="docforge-subrow-label">Cell Density</span>
            <div className="docforge-segmented-button-group">
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.tableDensity === 'compact' ? 'active' : ''}`}
                onClick={() => updateSettings({ tableDensity: 'compact' as TableDensity })}
              >
                <span>Compact</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${(!doc.settings.tableDensity || doc.settings.tableDensity === 'standard') ? 'active' : ''}`}
                onClick={() => updateSettings({ tableDensity: 'standard' as TableDensity })}
              >
                <span>Standard</span>
              </button>
              <button
                type="button"
                className={`docforge-seg-btn ${doc.settings.tableDensity === 'spacious' ? 'active' : ''}`}
                onClick={() => updateSettings({ tableDensity: 'spacious' as TableDensity })}
              >
                <span>Spacious</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 7: Reset All Settings Button */}
        <section className="docforge-settings-section reset-section">
          <button
            type="button"
            className="docforge-btn docforge-btn-ghost full-width"
            onClick={handleResetAllSettings}
          >
            <RotateCcw size={14} />
            <span>Reset Layout to Defaults</span>
          </button>
        </section>
      </div>
    </aside>
  );
};
