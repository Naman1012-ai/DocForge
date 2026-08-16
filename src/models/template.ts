/**
 * DocFrame Phase 13 — Template & Document Preset Model
 */

import type { ThemeId } from './theme';
import type { PageSettings } from './settings';

export type TemplateId =
  | 'blank'
  | 'academic-report'
  | 'project-report'
  | 'research-paper'
  | 'technical-documentation'
  | 'business-report'
  | 'proposal'
  | 'meeting-notes';

export type TemplateCategory = 'General' | 'Academic' | 'Engineering' | 'Business' | 'Productivity';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: TemplateCategory;
  description: string;
  recommendedTheme: ThemeId;
  defaultSettings: Partial<PageSettings>;
  title: string;
  starterContent: string;
  badge: string;
}

export const BUILT_IN_TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  blank: {
    id: 'blank',
    name: 'Blank Document',
    category: 'General',
    description: 'Clean slate for custom reports, notes, or scratchpads with standard margins.',
    recommendedTheme: 'modern',
    defaultSettings: {
      format: 'a4',
      margins: 'standard',
      showPageNumbers: true,
      showHeader: false,
      showFooter: true,
    },
    title: 'Untitled Document',
    starterContent: `# [Document Title]

Start writing your document here...
`,
    badge: 'General',
  },

  'academic-report': {
    id: 'academic-report',
    name: 'Academic Report',
    category: 'Academic',
    description: 'Formal scholarly structure with abstract, methodology, results, discussion, and citation references.',
    recommendedTheme: 'academic',
    defaultSettings: {
      format: 'a4',
      margins: 'standard',
      showPageNumbers: true,
      showHeader: true,
      headerText: 'Academic Report',
      showFooter: true,
    },
    title: 'Comparative Analysis of Distributed Consensus Protocols',
    starterContent: `# Comparative Analysis of Distributed Consensus Protocols

**Author:** [Author Name]  
**Institution:** [Department of Computer Science, University Name]  
**Date:** [Semester / Academic Year]  

---

### Abstract
[Provide a concise 150-250 word summary of the research questions, experimental approach, core findings, and broader academic implications of this report.]

---

## 1. Introduction
[Introduce the domain context, background motivation, and problem scope that necessitates this academic inquiry.]

## 2. Objectives
- Primary objective: [State primary thesis or target milestone]
- Secondary objective: [State supporting investigation or measurement]
- Scope constraints: [Define theoretical or practical evaluation boundaries]

## 3. Methodology
[Detail the theoretical formulation, experimental baseline, dataset synthesis, and validation metrics used to ensure reproducibility.]

## 4. Results & Findings
[Present observed measurements, empirical evaluations, and statistical insights.]

| Protocol Variant | Mean Throughput (tx/s) | P99 Latency (ms) | Fault Tolerance |
| :--- | :--- | :--- | :--- |
| Baseline Raft | 12,450 | 18.2 | N/2 + 1 nodes |
| Optimistic Paxos | 15,800 | 14.6 | N/2 + 1 nodes |
| Byzantine BFT | 8,920 | 32.4 | (N-1)/3 nodes |

## 5. Discussion
[Analyze the trade-offs, theoretical implications, performance divergences, and external validity of the findings.]

## 6. Conclusion
[Summarize conclusive contributions, practical takeaways, and future research directions.]

---

## References
1. Lamport, L. (1998). *The Part-Time Parliament*. ACM Transactions on Computer Systems, 16(2), 133–169.
2. Ongaro, D., & Ousterhout, J. (2014). *In Search of an Understandable Consensus Algorithm*. USENIX Annual Technical Conference.
`,
    badge: 'Scholarly',
  },

  'project-report': {
    id: 'project-report',
    name: 'Project Report',
    category: 'Engineering',
    description: 'Complete engineering project documentation with problem statement, system architecture, results, and roadmap.',
    recommendedTheme: 'executive',
    defaultSettings: {
      format: 'a4',
      margins: 'standard',
      showPageNumbers: true,
      showHeader: true,
      headerText: 'Engineering Project Report',
      showFooter: true,
    },
    title: 'DocFrame High-Fidelity Client-Side Document Synthesis System',
    starterContent: `# DocFrame High-Fidelity Document Synthesis System

**Project Lead:** [Engineer / Team Name]  
**Status:** [Production Ready / Milestone 1.0]  
**Date:** [Project Date]  

---

## Executive Summary
[Summarize the project vision, delivered architecture, technical milestones, performance benchmarks, and user impact in 2-3 paragraphs.]

---

## 1. Introduction & Background
[Describe the motivation behind the initiative, previous technological limitations, and operational goals.]

## 2. Problem Statement
- **Viewport Slicing Artifacts**: Legacy client-side PDF tools cut canvases indiscriminately across pixel boundaries, slicing text and table borders.
- **Uncontrolled Page Overflow**: Lack of discrete-sheet bounds caused content overlap and zero intermediate running headers.
- **Third-Party Data Egress**: Cloud document converters create privacy risks and vendor lock-in.

## 3. Objectives
1. Build a 100% client-side document synthesis and reconstruction pipeline.
2. Implement discrete physical sheet pagination matching ISO A4 and US Letter standards.
3. Support multi-format input convergence across Markdown, Plain Text, PDF, Word (DOCX), and HTML.

## 4. Proposed Solution & Architecture
[Detail the modular engine architecture from input adapters to normalized document trees and vector PDF output.]

## 5. Implementation Milestones
- **Milestone 1**: Core Normalized Document Model and DOM rendering engine.
- **Milestone 2**: Discrete-Sheet Pagination Engine with overflow prevention.
- **Milestone 3**: Multi-Format Input Adapters (PDF.js, Mammoth, DOMParser).
- **Milestone 4**: Professional Theme Presets & Template Registry.

## 6. Results & Benchmark Metrics
| Measurement Area | Target SLA | Measured Performance | Verification Status |
| :--- | :--- | :--- | :--- |
| Parsing Latency | < 50 ms | 12.4 ms | Passed |
| Discrete Pagination | < 150 ms | 48.0 ms | Passed |
| Vector PDF Export | < 1.0 s | 320 ms | Passed |

## 7. Challenges & Mitigation
[Outline technical roadblocks encountered during implementation and how they were resolved.]

## 8. Future Scope & Roadmap
- Client-side OCR for scanned legacy archives.
- Two-way bidirectional DOCX export.

## 9. Conclusion
[Final remarks on project deliverables and operational readiness.]
`,
    badge: 'Technical',
  },

  'research-paper': {
    id: 'research-paper',
    name: 'Research Paper',
    category: 'Academic',
    description: 'Standard research paper format with keywords, related work, formal experimental evaluation, and bibliography.',
    recommendedTheme: 'academic',
    defaultSettings: {
      format: 'a4',
      margins: 'standard',
      showPageNumbers: true,
      showHeader: true,
      headerText: 'Research Paper',
      showFooter: true,
    },
    title: 'Deterministic Client-Side Document Layout and Discrete Sheet Pagination',
    starterContent: `# Deterministic Client-Side Document Layout and Discrete Sheet Pagination

**Author:** [Principal Investigator]  
**Co-Authors:** [Research Collaborator, Advisor]  
**Affiliation:** [Research Laboratory / Department]  

---

### Abstract
[State the research hypothesis, methodology, experimental findings, and contributions in one cohesive paragraph.]

**Keywords:** *Document Layout Analysis, Client-Side Synthesis, Discrete Pagination, Vector PDF Export*

---

## 1. Introduction
[Establish the research context, formulate the primary research questions, and outline the structure of this paper.]

## 2. Related Work
[Review existing literature, prior document processing frameworks, and comparative state-of-the-art.]

## 3. Theoretical Formulation & Methodology
[Detail the formal algorithms, coordinate transform spaces, and mathematical bounds.]

## 4. Empirical Evaluation
[Describe the experimental setup, test fixtures, synthetic benchmarks, and real-world evaluation corpora.]

## 5. Discussion
[Analyze experimental behavior, edge cases, failure modes, and architectural implications.]

## 6. Conclusion
[Summarize key scientific findings and state avenues for future work.]

---

## References
1. Author, A. (2025). *Foundations of Digital Typography and Vector Layout*. Journal of Document Engineering, 42(3), 200–225.
2. Researcher, B. (2026). *Privacy-Preserving In-Browser Processing*. Computing Surveys, 18(1), 45–68.
`,
    badge: 'Scholarly',
  },

  'technical-documentation': {
    id: 'technical-documentation',
    name: 'Technical Documentation',
    category: 'Engineering',
    description: 'Comprehensive software or API technical guide with prerequisites, configuration, code snippets, and troubleshooting.',
    recommendedTheme: 'technical',
    defaultSettings: {
      format: 'a4',
      margins: 'standard',
      showPageNumbers: true,
      showHeader: true,
      headerText: 'Technical Documentation',
      showFooter: true,
    },
    title: 'DocFrame Client-Side API & Integration Guide',
    starterContent: `# DocFrame Integration & Configuration Guide

**Version:** 1.0.0-rc  
**Target Platform:** Web / Desktop (Modern Chromium, Firefox, WebKit)  

---

## 1. Overview
DocFrame is a high-performance, client-side document synthesis and PDF export framework. It transforms Markdown, Plain Text, PDF, DOCX, and HTML documents into publication-quality discrete-sheet PDFs.

## 2. Prerequisites
- Node.js >= 18.0.0
- Modern Browser with ES2022+ and Web Worker support

## 3. Installation
\`\`\`bash
npm install
npm run build
\`\`\`

## 4. Configuration Options
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| \`format\` | \`'a4' | 'letter'\` | \`'a4'\` | Physical page dimensions |
| \`margins\` | \`'compact' | 'standard' | 'relaxed'\` | \`'standard'\` | Page margin presets (15mm / 25mm / 35mm) |
| \`showPageNumbers\` | \`boolean\` | \`true\` | Renders running footer page counts |

## 5. Usage Example
\`\`\`typescript
import { parseToNormalizedDocument } from './lib/parser/markdownParser';

const normalized = parseToNormalizedDocument('# Hello World');
console.log('Document Blocks:', normalized.blocks.length);
\`\`\`

## 6. API Reference
### \`parseToNormalizedDocument(markdown: string): NormalizedDocument\`
Converts raw Markdown text into a validated AST representing headings, paragraphs, lists, tables, and blockquotes.

## 7. Troubleshooting & FAQ
- **Problem**: Table columns appear narrow on smaller pages.  
  **Fix**: Switch page format to Landscape or reduce margin size in Page Settings.
- **Problem**: PDF download does not trigger on strict browser sandbox.  
  **Fix**: Ensure popup blockers are disabled for local document previews.

## 8. Conclusion
For questions and updates, consult the official repository documentation.
`,
    badge: 'API & Code',
  },

  'business-report': {
    id: 'business-report',
    name: 'Business Report',
    category: 'Business',
    description: 'Executive business report with key findings, market analysis, strategic recommendations, and financial plan.',
    recommendedTheme: 'executive',
    defaultSettings: {
      format: 'a4',
      margins: 'standard',
      showPageNumbers: true,
      showHeader: true,
      headerText: 'Executive Business Report',
      showFooter: true,
    },
    title: 'Quarterly Strategic Business Performance Review',
    starterContent: `# Quarterly Strategic Business Performance Review

**Prepared For:** Executive Leadership Board  
**Prepared By:** Strategic Operations & Finance Team  
**Reporting Period:** Q3 / Fiscal Year 2026  

---

## Executive Summary
During the third quarter, the organization achieved exceptional operational momentum, outperforming revenue projections by 18.4% while maintaining strong cost discipline.

---

## 1. Business Context & Market Overview
[Provide an analysis of market conditions, competitive positioning, macroeconomic factors, and organizational priorities.]

## 2. Key Performance Indicators (KPIs)
| Strategic Metric | Target | Actual Result | Variance |
| :--- | :--- | :--- | :--- |
| Net Recurring Revenue | $4.2M | $4.98M | +18.5% |
| Customer Acquisition Cost (CAC) | $420 | $385 | -8.3% (Improved) |
| Gross Retention Rate | 94.0% | 96.8% | +2.8% |
| Operating Margin | 22.0% | 25.4% | +3.4% |

## 3. Analysis & Key Findings
- **Product Adoption**: Self-service document synthesis adoption grew by 42% quarter-over-quarter.
- **Operational Efficiency**: In-browser local processing eliminated cloud conversion compute costs by 100%.

## 4. Strategic Recommendations
1. **Accelerate Enterprise Rollout**: Expand multi-format import capabilities to support enterprise compliance needs.
2. **Invest in Offline Workflows**: Deepen local-first storage and template customization features.

## 5. Implementation Roadmap & Timeline
- **Phase 1 (Months 1-2)**: Enterprise security hardening and accessibility certification.
- **Phase 2 (Months 3-4)**: Advanced data table styling and custom preset exports.

## 6. Conclusion
The business remains well-positioned for sustainable long-term expansion heading into the subsequent fiscal year.
`,
    badge: 'Executive',
  },

  proposal: {
    id: 'proposal',
    name: 'Project Proposal',
    category: 'Business',
    description: 'Structured commercial or technical proposal detailing problem context, solution scope, timeline, and deliverables.',
    recommendedTheme: 'modern',
    defaultSettings: {
      format: 'a4',
      margins: 'standard',
      showPageNumbers: true,
      showHeader: true,
      headerText: 'Project Proposal',
      showFooter: true,
    },
    title: 'Proposal: Next-Generation Local Document Engine',
    starterContent: `# Project Proposal: Next-Generation Local Document Engine

**Client / Stakeholder:** [Organization Name]  
**Submitted By:** [Team / Provider Name]  
**Date:** [Submission Date]  

---

## Executive Summary
This proposal outlines a high-impact initiative to modernize document creation workflows with a privacy-first, client-side synthesis and PDF export platform.

---

## 1. Background & Context
[Describe the client's current pain points, legacy software bottlenecks, and strategic motivation.]

## 2. The Opportunity & Solution Scope
Our solution delivers a unified document workbench that executes 100% within the browser, guaranteeing zero third-party data egress while delivering print-perfect PDF output.

### Scope Deliverables:
- Universal multi-format importer (Markdown, PDF, DOCX, HTML).
- Real-time discrete physical sheet preview.
- One-click vector PDF generation.

## 3. Implementation Plan & Schedule
| Phase | Duration | Key Milestone Deliverable |
| :--- | :--- | :--- |
| Phase 1 | 2 Weeks | Format-agnostic document normalization model |
| Phase 2 | 3 Weeks | Discrete-sheet pagination engine and theme tokens |
| Phase 3 | 2 Weeks | Security audit, accessibility review, and production launch |

## 4. Resource Requirements & Budget
[Detail the staffing allocations, timeline commitments, and commercial terms.]

## 5. Expected Outcomes & ROI
- **100% Data Confidentiality**: Zero document data transmitted over the internet.
- **Zero Slicing Defects**: Pixel-perfect physical page boundaries.

## 6. Next Steps & Authorization
To authorize this initiative, please sign and return the approval form below.

**Authorized Signature:** ______________________  
**Date:** ______________________
`,
    badge: 'Proposal',
  },

  'meeting-notes': {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    category: 'Productivity',
    description: 'Clean, focused agenda and minutes format with attendee lists, discussion summaries, and action item tracking.',
    recommendedTheme: 'minimal',
    defaultSettings: {
      format: 'a4',
      margins: 'compact',
      showPageNumbers: true,
      showHeader: false,
      showFooter: true,
    },
    title: 'Product Engineering Sync Minutes',
    starterContent: `# Product Engineering Sync Minutes

**Date:** [Date and Time]  
**Location:** [Meeting Room / Video Conference Link]  
**Meeting Facilitator:** [Lead Name]  
**Note Taker:** [Note Taker Name]  

---

## Attendees
- [Name 1] (Engineering Lead)
- [Name 2] (Product Manager)
- [Name 3] (Design & UX Specialist)
- [Name 4] (QA Engineer)

---

## Agenda
1. Review of Phase 12 DOCX and HTML import release metrics
2. Demonstration of Phase 13 Template Registry
3. Sprint priorities and deployment schedule

---

## Discussion & Key Decisions
- **DOCX / HTML Support**: Initial testing confirmed 100% test pass rate with zero security vulnerabilities.
- **Templates & Presets**: Agreed to launch 8 curated built-in templates covering academic, technical, executive, and general use cases.
- **Theme Coupling**: Confirmed templates provide starter defaults while leaving themes freely customizable.

---

## Action Items
| Owner | Task Description | Target Due Date |
| :--- | :--- | :--- |
| [Engineer 1] | Finalize Template Selector modal with keyboard navigation | End of Sprint |
| [Designer] | Review template badge contrast ratios for WCAG compliance | Tomorrow |
| [QA Lead] | Execute full regression suite across all 8 templates | Friday |

---

## Next Meeting
**Date:** [Next Date]  
**Proposed Agenda:** [Upcoming Topics]
`,
    badge: 'Notes',
  },
};

export const TEMPLATE_LIST: TemplateDefinition[] = Object.values(BUILT_IN_TEMPLATES);
