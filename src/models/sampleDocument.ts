export const SAMPLE_MARKDOWN_DOCUMENT = `# Quarterly Architecture & Engineering Report

## 1. Executive Summary

DocFrame represents a major advancement in **local-first document authoring** and *vector PDF generation*. By shifting document parsing and layout calculation to modern browser engines, we provide ~~cumbersome manual formatting~~ **instant visual feedback** while guaranteeing complete data privacy.

---

## 2. Key Performance Milestones

Here are the primary objectives accomplished during this cycle:

* **Deterministic Pagination**: 100% visual parity between live preview sheets and output PDFs.
* **Sub-millisecond Feedback**: Low-latency AST transformation pipeline.
  * Markdown parsing via *unified* and *remark-gfm*.
  * Strict schema-based HTML sanitization with *rehype-sanitize*.
* **Zero Server Dependency**: 100% client-side privacy.

### Task Checklist

- [x] Phase 0: Product Definition & System Architecture
- [x] Phase 1: Application Shell & Responsive Workspace
- [x] Phase 2: Markdown Editor & Input Pipeline
- [ ] Phase 3: Document Model & Component Renderer
- [ ] Phase 4: Paginated Virtual Sheet Engine
- [ ] Phase 5: Vector PDF Generation & Export

---

## 3. Core Philosophy & Value Proposition

> "Quality document formatting should never demand complex markup skills, command-line toolchains, or compromise user privacy."

### Key Principles:
1. **Content First**: Focus on writing without wrestling with margin boxes.
2. **True Vector Fidelity**: Selectable text and sharp typography at any zoom level.
3. **Privacy by Design**: Sensitive notes, resumes, and corporate reports never leave the local machine.

---

## 4. Benchmark Performance Matrix

| Pipeline Stage | Target Latency | Actual Latency | Engine Status |
| :--- | :---: | :---: | :--- |
| Markdown AST Parse | < 15ms | ~4.2ms | **Optimal** |
| Virtual Page Reflow | < 30ms | ~12.1ms | **Optimal** |
| Vector PDF Generation | < 250ms | ~85.0ms | **Verified** |

---

## 5. Implementation Code Sample

Here is the core document processing contract:

\`\`\`typescript
interface DocumentPipeline {
  parse(rawInput: string): DocumentAST;
  sanitize(ast: DocumentAST): SafeAST;
  renderToVector(ast: SafeAST, settings: PageSettings): Promise<Blob>;
}
\`\`\`

---

## 6. Resources & Reference Links

* Explore the project architecture at [DocFrame GitHub Repository](https://github.com/docframe/engine).
* For styling standards, refer to the [CommonMark Specification](https://commonmark.org).
`;
