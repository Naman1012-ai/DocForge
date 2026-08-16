# DocFrame — System Architecture & Technical Design

## 1. Executive Summary

DocFrame is an architecture-first, privacy-respecting, client-side web application for generating high-quality PDFs from structured text and multiple file formats. This document outlines the technical design, security model, discrete-sheet pagination engine, multi-provider AI architecture, data flow, rendering pipeline, PDF export engine, and test architecture.

---

## 2. Universal Processing & Rendering Pipeline

```text
[1. MULTI-FORMAT USER INPUT]
    ├── Markdown (.md) / Plain Text (.txt) ──► Remark/Rehype AST Normalizer
    ├── Word Document (.docx) ──────────────► Mammoth.js HTML ──► Markdown AST
    ├── Web Page (.html) ───────────────────► DOMParser / Turndown ──► Markdown AST
    ├── Vector / Text PDF (.pdf) ───────────► PDF.js ──► Structural Reconstructor ──► Markdown AST
    └── AI Assistant Transformations ───────► Pluggable AI Provider ──► Sanitizer ──► Markdown AST
                           │
                           ▼
[2. UNIFIED DOCUMENT MODEL (DocumentModel in src/models/document.ts)]
    ├── id, title, content (Normalized Markdown)
    ├── theme: minimal | executive | academic | technical | modern
    ├── settings: format (A4/Letter/Legal), orientation, margins, scaling, fonts, headers/footers
    ├── metadata: wordCount, characterCount, readingTimeMinutes, lastSavedAt
    └── IndexedDB Workspace Persistence (workspaceStorage.ts)
                           │
                           ▼
[3. THEME ENGINE & DESIGN TOKEN RESOLUTION (resolveThemeTokens)]
    │ (Combines ThemeConfig + PageSettings + Custom Accent + Font Scaling)
    ▼
[4. DISCRETE-SHEET PAGINATION ENGINE (paginateDocumentHtml in src/lib/pagination/paginator.ts)]
    ├── Calculates usable content dimensions:
    │   usableHeight = totalHeight - marginTop - marginBottom - headerReserve - footerReserve
    ├── Splits HTML into top-level blocks (headings, paragraphs, tables, code, lists, quotes)
    ├── Enforces Heading Orphan Prevention (avoids stranded headings at bottom of page)
    └── Yields Array of Virtual Page Blocks: [Page 1 Blocks, Page 2 Blocks, Page 3 Blocks...]
                           │
                           ▼
[5. DOCUMENT RENDERER (DocumentRenderer.tsx)]
    │ (Renders an array of discrete <DocumentPage> containers)
    ├── Page 1 Container: Header 1 + Content 1 + Footer ("Page 1 of N")
    ├── Page 2 Container: Header 2 + Content 2 + Footer ("Page 2 of N")
    └── Page N Container: Header N + Content N + Footer ("Page N of N")
                           │
                           ▼
[6. PREVIEW VIEWPORT, ISOLATED PRINT & PDF EXPORT]
    ├── A. Direct Vector PDF Export (pdfExportService.ts):
    │      └── Normalizes cloned sheets (1:1 offscreen scaling)
    │      └── Renders discrete sheets into high-DPI PDF pages without border cuts
    └── B. Isolated Native Print Driver (@media print + #document-print-root):
           └── Offscreen in screen mode; rendered exclusively during browser print dialog
```

---

## 3. Universal Multi-Provider AI Architecture (Phase 16)

DocFrame provides a dual-mode AI transformation subsystem managed through the `AIProvider` interface:

```text
                               ┌─► [DocFrame Local Engine] (100% Offline, Zero Network)
                               ├─► [OpenAI API] (GPT-4o, GPT-4o-mini, o1-mini)
                               ├─► [Anthropic Claude] (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3.7)
[AI Transformation Request] ───┼─► [Google Gemini] (Gemini 2.0 Flash, Gemini 2.5 Flash, Gemini 1.5 Flash)
                               ├─► [Groq Cloud] (Llama 3.3 70B, Mixtral 8x7B)
                               ├─► [DeepSeek] (DeepSeek V3, DeepSeek R1)
                               ├─► [OpenRouter] (Unified access to 200+ models)
                               ├─► [Ollama / Local LLM] (Self-hosted llama3, mistral — 0 keys)
                               └─► [Custom API / Proxy] (Any OpenAI-compatible gateway)
```

1. **Context-Aware Local Engine (`LocalAIProvider`)**:
   - Performs dynamic context analysis (`analyzeDocumentContent`) on the user's actual document sentences, headings, characters, and dialogue.
   - 100% client-side execution with zero external network transmission and zero configuration.
2. **Universal Remote Provider (`OpenAICompatibleProvider`, `AnthropicProvider`, `GeminiProvider`)**:
   - Native support for official OpenAI, Anthropic (direct browser access), Google Gemini, Groq, DeepSeek, OpenRouter, and Ollama servers.
   - Built-in URL auto-healing and normalization to prevent 404 errors when base URLs are supplied.
   - Auto-fallback to local dev proxy (`/api/ollama`) to bypass browser CORS restrictions when testing local models.
3. **Anti-Prompt Injection Guardrails (`src/lib/ai/prompts.ts`)**:
   - Untrusted document text is enclosed inside explicit XML boundary delimiters: `<docframe_untrusted_content>`.
   - The remote model is instructed to treat the document strictly as passive data rather than instructions.
4. **Volatile Key Management & Sanitization**:
   - API keys are held strictly in memory state during the active browser session; never written to `localStorage` or transmitted to third parties.
   - All AI output is passed through `sanitizeGeneratedMarkdown()` before applying to the document model.

---

## 4. Security Model & Threat Boundaries

1. **Local-First Sandboxing**: 100% of document content, imported files, and exported PDFs remain strictly inside the client browser sandbox.
2. **Untrusted Content Sanitization**: Markdown input is parsed into an AST and passed through `rehype-sanitize` with a strict whitelist schema.
3. **Multi-Format Ingestion Hardening**:
   - File uploads restricted to supported formats (`.md`, `.txt`, `.docx`, `.html`, `.pdf`) with a 25 MB max limit.
   - Path-traversal sanitization (`../../etc/passwd` ➔ `Passwd`).
4. **Resilient Local Persistence**:
   - IndexedDB database (`DocFrameWorkspaceDB` with transparent migration from legacy `DocForgeWorkspaceDB`) with automatic version migration and corrupted record recovery.
5. **Print Isolation**:
   - Screen UI components are isolated from the print DOM to ensure zero UI chrome leakage during printing.
6. **Progressive Web App (PWA) Security & Service Worker Isolation (Phase 17)**:
   - Standalone PWA installability with W3C Web App Manifest (`manifest.webmanifest`), 192×192/512×512/maskable icons, and iOS Apple Touch Icon.
   - Safe Service Worker (`sw.js`) that pre-caches the static application shell.
   - **Zero-Interception Security Rule**: All API calls (`/api/*`), remote LLM calls (OpenAI, Claude, Gemini, Groq, DeepSeek, OpenRouter), local Ollama endpoints (port 11434), and non-GET requests are strictly bypassed and never cached.

---

## 5. Automated Test Strategy & Architecture

DocFrame maintains **112 automated tests across 21 test suites** powered by Vitest:

1. `tests/pwa.test.ts`: Web App Manifest validation, icon dimensions & PNG headers, maskable/Apple icons, index.html links, service worker API bypass security.
2. `tests/aiTransformation.test.ts`: Multi-provider instantiation, URL normalizers, anti-injection prompts, sanitization, and context-aware transformations.
3. `tests/pagination.test.ts`: Physical page dimensions, block splitting, single-page fit, multi-page flows, heading orphan prevention, script/dialogue pagination.
4. `tests/templates.test.ts`: Built-in template registry, recommended theme mappings, starter content integrity.
5. `tests/printIsolation.test.ts`: Print root isolation, media query rules, and canvas dimensions.
6. `tests/pdfImporter.test.ts`: Multi-column layout reconstruction, table detection, heading level determination.
7. `tests/docxImporter.test.ts`: DOCX binary extraction, formatting conversion, error resilience.
8. `tests/htmlImporter.test.ts`: HTML cleanup, DOM parsing, GFM Markdown normalization.
9. `tests/workspace.test.ts`: IndexedDB workspace CRUD operations, search filters, sorting.
10. `tests/e2eUserJourney.test.ts`: End-to-end user journeys from raw input to theme resolution and PDF metadata.
11. `tests/markdownParser.test.ts`: Semantic HTML parsing and GFM task list/table support.
12. `tests/markdownEdgeCases.test.ts`: Empty inputs, unmatched syntax, multilingual Unicode (Hindi, Japanese, Arabic, Russian, Greek, math), malformed tables, nested lists.
13. `tests/securityAudit.test.ts`: Defense against XSS script tags, event handlers, dangerous URI protocols, embedding tags, and malicious SVGs.
14. `tests/fileUploadSecurity.test.ts`: Extension validation, size caps, and path-traversal sanitization.
15. `tests/persistenceResilience.test.ts`: Deserialization, schema migrations, and corrupted state recovery.
16. `tests/filename.test.ts`: Safe cross-platform filesystem filenames.
17. `tests/color.test.ts`: Hex validation, normalization, and WCAG contrast calculations.
18. `tests/themeResolution.test.ts`: Dynamic token resolution, custom accent overrides, and font scaling.
19. `tests/documentMetadata.test.ts`: Word, line, and character count calculations.
20. `tests/advancedSettings.test.ts`: Legal paper format, custom margins, line-height, and header/footer configurations.
21. `tests/pdfExport.test.ts`: PDF export error handling and option validation.

---

## 6. Directory Structure

```text
src/
├── components/              # Reusable UI & layout components
│   ├── feedback/            # ErrorBoundary
│   └── layout/              # AppShell, Header, Workspace, StatusBar
├── context/                 # Context definitions & DocumentProvider
│   ├── documentContextDefinition.ts
│   └── DocumentContext.tsx
├── features/                # Domain-specific feature modules
│   ├── ai/                  # AITransformationModal & provider config
│   ├── editor/              # Markdown editor, keyboard handlers, drag-and-drop
│   ├── preview/             # Paginated document sheet viewport & zoom
│   ├── renderer/            # DocumentRenderer, DocumentPage, DocumentHeader, DocumentFooter, PrintDocumentRoot
│   ├── settings/            # Document format, typography, custom accent, margin controls
│   ├── templates/           # TemplateModal & preset chooser
│   └── workspace/           # WorkspaceModal & local document manager
├── hooks/                   # Custom React hooks (useDocument)
├── lib/                     # Pure logic and parsing pipeline
│   ├── ai/                  # AI providers (Local, OpenAI, Claude, Gemini, prompts, validator)
│   ├── import/              # DOCX and HTML importers
│   ├── pagination/          # Discrete-sheet pagination engine (paginator.ts)
│   ├── parser/              # Remark/Rehype AST processing & sanitization
│   ├── pdf/                 # PDF reconstructor, layout analyzer, and PDF export service
│   └── storage/             # IndexedDB workspace storage layer
├── models/                  # Type contracts and domain models
│   ├── ai.ts                # AI operations, provider presets, and configurations
│   ├── document.ts          # Unified DocumentModel interface & metadata helpers
│   ├── documentTree.ts      # Reconstructed AST nodes for PDF/DOCX imports
│   ├── sampleDocument.ts    # First-launch fallback starter document
│   ├── settings.ts          # Page geometry, orientation, margins, font scales
│   ├── template.ts          # 8 built-in document preset templates
│   └── theme.ts             # 5 design themes and dynamic token resolver
├── styles/                  # CSS stylesheets (index.css, document.css, print.css)
├── types/                   # External ambient TypeScript declarations
└── utils/                   # Pure utility functions (color.ts, filename.ts)
```
