# DocFrame — Product Definition & Scope

## 1. Product Vision

> **A document generation tool that turns structured content into presentation-ready documents.**

DocFrame eliminates the frustration of formatting documents. Rather than forcing users to manually fight with margins in traditional word processors or write complex LaTeX/CSS markup, DocFrame accepts structured text (Markdown, DOCX, HTML, imported PDFs), automatically applies professional document styling, renders an accurate paginated preview, offers client-side AI editing assistance, and produces a publication-quality vector PDF.

---

## 2. Core Problem & Value Proposition

### The Problem
- **Word Processors (Word, Google Docs)**: Slow, brittle styling, tedious manual page-break management, inconsistent formatting when copying/pasting.
- **LaTeX / Typst**: High barrier to entry, requires command-line toolchains or complex syntax for simple daily documents.
- **Generic Markdown Converters**: Output raw, unstyled HTML dumped into a PDF with broken page cuts, missing page numbers, ugly code blocks, and zero visual pacing.
- **Cloud Document Services**: Compromise user privacy by uploading sensitive corporate documents and source code to remote servers.

### The DocFrame Solution
- Instant conversion from raw Markdown, DOCX, HTML, or imported PDFs to a beautifully paced, paginated document.
- Universal AI Document Assistant with 100% offline local rules as well as multi-provider LLM support.
- Local document workspace for persistent client-side document management without database dependencies.
- Zero setup, 100% browser-based, instant high-DPI vector PDF download.
- 100% private, client-side, and offline-capable.

---

## 3. Target Users & Use Cases

1. **Developers & Engineers**: Architecture design records, README exports, API documentation, technical incident reports.
2. **Students & Academics**: Essay submissions, research summaries, research papers with formal citations and tables.
3. **Consultants & Freelancers**: Project proposals, statement of work (SOW), client briefings, invoices, and executive summaries.
4. **Job Seekers**: Clean, formatted Markdown resumes and cover letters.
5. **Technical Writers & Note-Takers**: Meeting minutes, SOPs (Standard Operating Procedures), and reference guides.

---

## 4. Complete Feature Set

### 4.1 Ingestion & Input Capabilities
- **Direct Editing**: Markdown editor with toolbar formatting, keyboard shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+K`), and live sync.
- **Multi-Format Import**:
  - Markdown (`.md`) and Plain Text (`.txt`)
  - Word Documents (`.docx`) via Mammoth AST translation
  - Web Pages (`.html`) via DOMParser and Turndown GFM normalization
  - PDFs (`.pdf`) via PDF.js with structural multi-column and table reconstruction
- **Drag-and-Drop**: Drop files anywhere on the workspace for immediate conversion.

### 4.2 Universal AI Document Assistant (Phase 16)
- **7 Core Transformation Operations**:
  - *Improve Writing*: Refine clarity, eliminate redundancies, and polish prose.
  - *Summarize Document*: Generate Executive Summary and thematic takeaways.
  - *Change Tone*: Adapt register to Professional, Academic, Concise, or Friendly.
  - *Expand Content*: Contextually elaborate on points with supporting detail.
  - *Rewrite & Modernize*: Rephrase repetitive sections to enhance eloquence.
  - *Generate Section*: Synthesize contextual Introduction, Conclusion, FAQ, or Recommendations.
  - *Improve Structure*: Normalize heading hierarchy and organize sections.
- **Dual-Mode Provider Engine**:
  - **Local Engine (100% Offline & Free)**: Zero network, zero configuration, privacy-first NLP analyzer.
  - **Universal Remote Providers**: Official OpenAI, Anthropic Claude, Google Gemini, Groq Cloud, DeepSeek, OpenRouter, Ollama / Local LLM, and custom endpoints.
- **Diff & Document Preview**: Review formatted or raw Markdown transformations before applying (Replace or Insert) with 1-click Undo.

### 4.3 Document Presets & Templates
- 8 built-in professional document presets:
  1. *Academic Report* (Serif typography, formal abstract, citation layout)
  2. *Project Report* (Executive structure, deliverable tables, milestone tracking)
  3. *Research Paper* (Methodology, empirical results, academic theme)
  4. *Technical Documentation* (Language-tagged code blocks, task lists, tables)
  5. *Business Report* (Corporate styling, executive summaries, status tables)
  6. *Project Proposal* (Statement of work, deliverable matrices, timelines)
  7. *Meeting Notes* (Action items, attendee agendas, task checkboxes)
  8. *Blank Document* (Clean slate with standard geometry)

### 4.4 Local Document Workspace (Phase 15)
- IndexedDB-backed local storage (`DocFrameWorkspaceDB` with legacy compatibility).
- Document grid with live search, theme badges, word count, and last saved timestamps.
- Sorting by Last Updated, Title, or Word Count.
- Document management: Create New, Duplicate, Rename Title, Delete.

### 4.5 Document Customization & Design Tokens
- **Page Geometry**: A4 (`210mm × 297mm`), US Letter (`8.5in × 11in`), Legal (`8.5in × 14in`).
- **Orientation**: Portrait / Landscape.
- **Margins**: Standard (25mm), Compact (15mm), Relaxed (35mm), or Custom.
- **Typography & Font Scaling**: Sans-Serif, Serif, Monospace with compact/standard/large scales.
- **Document Themes**: Minimal, Professional / Executive, Academic, Technical, Modern Clean.
- **Headers & Footers**: Running document header with customizable title and dynamic page numbers ("Page X of Y").

### 4.6 PDF Generation & Print Isolation
- **Direct PDF Export**: High-DPI (300+ DPI) vector PDF download with exact visual parity to the preview sheet.
- **Isolated Native Print Driver**: Clean browser print preview via `@media print` with zero UI chrome artifacts.

---

## 5. User Journeys

### Journey A: Direct Authoring to PDF
1. **Entry**: User starts with a blank sheet or selects a template preset (e.g. *Technical Documentation*).
2. **Composition**: User writes in Markdown with live discrete-sheet pagination on the right.
3. **AI Polish**: User opens **AI Assist** $\rightarrow$ clicks **Improve Writing** $\rightarrow$ reviews diff $\rightarrow$ applies changes.
4. **Export**: User clicks **Export PDF** to produce a publication-quality PDF in seconds.

### Journey B: Document Conversion (DOCX / HTML / PDF)
1. **Upload**: User drops a Word `.docx` or `.pdf` file into the editor.
2. **Reconstruction**: DocFrame extracts the structure, tables, and headings into clean, editable Markdown.
3. **Restyling**: User switches the theme to *Executive* and sets margins to *Standard*.
4. **Export**: User downloads the formatted PDF.
