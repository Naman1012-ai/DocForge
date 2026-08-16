# DocFrame — Development Guide & Conventions

## 1. Development Principles

1. **Simplicity First**: Avoid unnecessary state machines, deep inheritance, or speculative abstractions.
2. **Deterministic Document State**: Document state flows in one direction: `Raw Input / Import` ➔ `Normalized Markdown AST` ➔ `Theme & Paginator` ➔ `Virtual Sheets` ➔ `PDF Output`.
3. **Defense-in-Depth**: Treat all user input, uploaded files, and AI provider outputs as untrusted. Sanitize before DOM insertion and PDF export.
4. **Local-First & Offline**: Every core feature (editing, templates, themes, workspace, pagination, export, local AI) must work seamlessly without active internet connectivity.
5. **Zero Layout Shifts**: Preview sheets maintain exact physical aspect ratios and dimensional consistency regardless of viewport resizing.

---

## 2. Development Commands

### Start Local Development Server
```bash
npm run dev
```

### Run Automated Test Suites (Vitest)
```bash
npm test
```

### Static Type Check & Fast Linting (Oxlint + TypeScript)
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

### Preview Production Build Locally
```bash
npm run preview
```

---

## 3. Built-In Document Templates

Located in [`src/models/template.ts`](file:///c:/CODING/Personal_Use_projects/Text_to_pdf_gpt/src/models/template.ts):
- **`academic-report`**: Academic research paper structure with abstract, methodology, formal tables, citations, and Academic Serif theme.
- **`technical-documentation`**: Developer documentation with code blocks, task lists, tables, and Technical theme.
- **`project-report`**: Executive status report with milestone tracking and Executive theme.
- **`proposal`**: Business project proposal and statement of work.
- **`business-report`**: Corporate status summaries and deliverable matrices.
- **`meeting-notes`**: Agenda, attendee checklist, action items.
- **`blank`**: Clean slate for custom authoring.

---

## 4. Test Suite Architecture

DocFrame maintains **106 automated tests across 20 test suites**:
- `tests/aiTransformation.test.ts` — Universal AI multi-provider, prompts, and validator
- `tests/pagination.test.ts` — Virtual discrete-sheet pagination & orphan prevention
- `tests/templates.test.ts` — Built-in document template validation
- `tests/printIsolation.test.ts` — Print root isolation & canvas dimensions
- `tests/pdfImporter.test.ts` — Multi-column PDF layout reconstruction
- `tests/docxImporter.test.ts` — Word document binary extraction & error handling
- `tests/htmlImporter.test.ts` — HTML DOM parsing and GFM Markdown normalization
- `tests/workspace.test.ts` — IndexedDB workspace persistence & CRUD
- `tests/e2eUserJourney.test.ts` — Complete input-to-export user journeys
- `tests/markdownParser.test.ts` — GFM AST tokenization & sanitization
- `tests/markdownEdgeCases.test.ts` — Edge cases, malformed tables, Unicode
- `tests/securityAudit.test.ts` — XSS injection defense & boundary protection
- `tests/fileUploadSecurity.test.ts` — File extension & path traversal sanitization
- `tests/persistenceResilience.test.ts` — Corrupted storage fallback & migrations
- `tests/filename.test.ts` — Cross-platform filesystem filename generation
- `tests/color.test.ts` — Color normalization & WCAG contrast validation
- `tests/themeResolution.test.ts` — Design token resolution & font scaling
- `tests/documentMetadata.test.ts` — Word count & reading time calculations
- `tests/advancedSettings.test.ts` — Legal format, orientation, line spacing
- `tests/pdfExport.test.ts` — Client-side vector PDF export validation
