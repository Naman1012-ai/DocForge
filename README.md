# DocFrame (Text-to-PDF Engine)

> **Structured text → professionally formatted document → PDF**

DocFrame is a high-performance, local-first web application designed to transform structured text, Markdown, DOCX, HTML, and imported PDFs into presentation-ready, beautifully styled, downloadable vector PDF documents with client-side AI document assistance.

---

## 📌 Project Status

- **Phase 0 — Product Definition & Architecture**: ✅ Completed
- **Phase 1 — Application Foundation & Core UI Shell**: ✅ Completed
- **Phase 2 — Markdown Editor & Input Pipeline**: ✅ Completed
- **Phase 3 — Document Rendering Engine & Professional Preview**: ✅ Completed
- **Phase 4 — PDF Generation, Export & Preview Fidelity**: ✅ Completed
- **Phase 5 — Document Themes, Customization & Professional Design System**: ✅ Completed
- **Phase 6 — UX Polish, Responsive Hardening & Accessibility**: ✅ Completed
- **Phase 7 — Testing, Quality Assurance & Security Audit**: ✅ Completed (Quality Gate Passed)
- **Phase 9 — Real-World Validation & Release Engineering**: ✅ Completed (v1.0.0 Release Candidate)
- **Phase 9A — Critical PDF Pagination & Page-Break Repair**: ✅ Completed (Discrete-Sheet Engine)
- **Phase 10 — PDF Import & Editable Document Reconstruction**: ✅ Completed (Local PDF.js Pipeline)
- **Phase 11 — PDF Import Quality & Document Reconstruction 2.0**: ✅ Completed (Multi-Column, Tables, Hierarchy)
- **Phase 11.1 — Precision Multi-Column Layout & False-Positive Repair**: ✅ Completed (Zero-False-Positive Filter)
- **Phase 12 — DOCX + HTML Import & Unified Document Convergence**: ✅ Completed (Mammoth & DOMParser Pipeline)
- **Phase 13 — Templates & Document Presets**: ✅ Completed (8 Built-In Curated Presets)
- **Phase 14 — Advanced Document Controls & Layout Configuration**: ✅ Completed (Legal Format, Orientation, Spacing & Geometry)
- **Phase 15 — Local Document Workspace & Persistent Document Management**: ✅ Completed (IndexedDB Local Workspace, Search, Sort & CRUD)
- **Phase 16 — AI Document Transformation & AI-Assisted Editing**: ✅ Completed (Universal Multi-Provider Engine: Offline Local, OpenAI, Claude, Gemini, Groq, DeepSeek, OpenRouter, Ollama)

---

## 🎯 Production Quality & Security Guarantees

- **100% Client-Side Privacy**:
  - Zero required document uploads, zero telemetry tracking, and zero mandatory cloud storage dependencies. Operates entirely offline inside the browser sandbox.
- **Universal Multi-Format Ingestion**:
  - Direct import for Markdown (`.md`), Plain Text (`.txt`), Word Documents (`.docx`), Web Pages (`.html`), and vector/text PDFs (`.pdf`) with structural reconstruction into the unified `DocumentModel`.
- **Universal Multi-Provider AI Assistant**:
  - **Local Engine (100% Offline & Private)**: Built-in context-aware NLP engine with zero network transmission and zero API keys.
  - **Remote Providers**: Native support for **OpenAI**, **Anthropic Claude**, **Google Gemini**, **Groq Cloud**, **DeepSeek**, **OpenRouter**, **Ollama / Local LLMs**, and custom endpoints.
  - **Anti-Prompt Injection Defense**: Untrusted user text enclosed in strict XML boundary delimiters (`<docframe_untrusted_content>`).
  - **Volatile Session Security**: Remote API keys stored strictly in volatile session memory; never persisted to disk or cookies.
- **Strict Multi-Layer Security Boundary**:
  - Whitelist-based sanitization schema via `unified`, `remark-gfm`, and `rehype-sanitize`.
  - Comprehensive protection against XSS injections (`<script>`, `onerror=`, `onload=`, `javascript:`, `vbscript:`, `data:text/html`, `<svg><script>`, `<iframe/embed/object>`).
  - Path-traversal sanitization during file uploads (`../../etc/passwd.md` -> `Passwd`).
- **Resilient Local Workspace & State Recovery**:
  - IndexedDB-backed local workspace storage with automated metadata calculations, title editing, duplicate, delete, and real-time search/filter.
  - Safe deserialization with automatic fallback for corrupted state and forward schema migrations.
- **Publication-Grade Document Design System**:
  - 5 curated professional themes (**Minimal**, **Professional / Executive**, **Academic**, **Technical**, **Modern Clean**).
  - 8 built-in document preset templates (*Academic Report, Project Report, Research Paper, Technical Documentation, Business Report, Proposal, Meeting Notes, Blank Document*).
  - Real-time customization controls for custom accent colors with WCAG contrast validation, font scaling, line spacing, margins, and paper geometry (A4, US Letter, Legal).
- **High-Fidelity PDF Generation & Print Isolation**:
  - Client-side vector PDF generation via `jsPDF` + `html2canvas` at high-DPI (300+ DPI sharpness).
  - Isolated `@media print` CSS root to guarantee clean browser print previews without UI chrome leaks.
  - Multi-page slicing across exact physical page boundaries without orphaned headings or cut text lines.
- **Automated Test Coverage**:
  - **106 automated tests across 20 test suites** covering parsing, edge cases, security payloads, persistence resilience, color contrast, multi-format importers, print isolation, and AI transformations.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Running Development Server
```bash
npm run dev
```

### Running Automated Test Suites
```bash
npm test
```

### Type Checking & Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

---

## 📚 Project Documentation

- [ARCHITECTURE.md](file:///c:/CODING/Personal_Use_projects/Text_to_pdf_gpt/ARCHITECTURE.md) — Technical architecture, security design, design token schema, multi-provider AI engine, and export pipeline.
- [PRODUCT.md](file:///c:/CODING/Personal_Use_projects/Text_to_pdf_gpt/PRODUCT.md) — Product requirements, user journeys, scope & boundaries.
- [DEVELOPMENT.md](file:///c:/CODING/Personal_Use_projects/Text_to_pdf_gpt/DEVELOPMENT.md) — Development conventions, testing commands, and workflows.
- [PHASE-16.md](file:///c:/CODING/Personal_Use_projects/Text_to_pdf_gpt/PHASE-16.md) — AI Document Transformation & AI-Assisted Editing specifications.