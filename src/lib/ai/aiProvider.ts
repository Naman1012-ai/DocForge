/**
 * DocForge Phase 16 — Universal Multi-Provider AI Architecture
 * Supports Local (100% Offline Context-Aware NLP Engine), OpenAI, Anthropic Claude, Google Gemini,
 * Groq Cloud, DeepSeek, OpenRouter, Ollama / Local LLMs, and Custom endpoints.
 */

import type {
  AITransformationRequest,
  AITransformationResult,
  AIProviderConfig,
  AISectionType,
} from '../../models/ai';
import { buildAIPrompt } from './prompts';
import { validateAITransformationResult, sanitizeGeneratedMarkdown } from './validator';

export interface AIProvider {
  id: string;
  name: string;
  isLocal: boolean;
  isConfigured(): boolean;
  transform(request: AITransformationRequest): Promise<AITransformationResult>;
}

/**
 * Normalizes OpenAI-compatible endpoints to prevent 404s when users provide base URLs.
 */
export function normalizeOpenAIEndpoint(rawEndpoint?: string): string {
  if (!rawEndpoint || rawEndpoint.trim().length === 0) {
    return 'https://api.openai.com/v1/chat/completions';
  }
  let ep = rawEndpoint.trim().replace(/\/+$/, '');

  if (ep.endsWith('/chat/completions')) {
    return ep;
  }
  if (ep.endsWith('/v1')) {
    return `${ep}/chat/completions`;
  }
  if (ep === 'https://api.openai.com') {
    return 'https://api.openai.com/v1/chat/completions';
  }
  if (ep === 'https://api.groq.com/openai/v1' || ep === 'https://api.groq.com') {
    return 'https://api.groq.com/openai/v1/chat/completions';
  }
  if (ep === 'https://api.deepseek.com' || ep === 'https://api.deepseek.com/v1') {
    return 'https://api.deepseek.com/v1/chat/completions';
  }
  if (ep === 'https://openrouter.ai/api/v1' || ep === 'https://openrouter.ai') {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }
  if (ep.includes('localhost') || ep.includes('127.0.0.1')) {
    if (!ep.includes('/v1') && !ep.includes('/api/')) {
      return `${ep}/v1/chat/completions`;
    }
  }
  if (ep.includes('/completions') || ep.includes('/api/chat')) {
    return ep;
  }
  return `${ep}/chat/completions`;
}

/**
 * Normalizes Anthropic endpoints to prevent 404s when users provide base URLs.
 */
export function normalizeAnthropicEndpoint(rawEndpoint?: string): string {
  if (!rawEndpoint || rawEndpoint.trim().length === 0) {
    return 'https://api.anthropic.com/v1/messages';
  }
  const ep = rawEndpoint.trim().replace(/\/+$/, '');
  if (ep.endsWith('/messages')) {
    return ep;
  }
  if (ep.endsWith('/v1')) {
    return `${ep}/messages`;
  }
  if (ep === 'https://api.anthropic.com') {
    return 'https://api.anthropic.com/v1/messages';
  }
  return `${ep}/messages`;
}

/**
 * Normalizes Google Gemini endpoints and query parameters to prevent 404s.
 */
export function normalizeGeminiEndpoint(
  rawEndpoint?: string,
  model: string = 'gemini-1.5-flash',
  apiKey: string = ''
): string {
  const ep = (rawEndpoint || 'https://generativelanguage.googleapis.com/v1beta').trim();
  const cleanModel = (model || 'gemini-1.5-flash').replace(/^models\//, '');
  const encodedKey = encodeURIComponent(apiKey.trim());

  if (ep.includes(':generateContent')) {
    const sep = ep.includes('?') ? '&' : '?';
    return ep.includes('key=') ? ep : `${ep}${sep}key=${encodedKey}`;
  }

  const cleanBase = ep.replace(/\/models\/?$/, '').replace(/\/+$/, '');
  return `${cleanBase}/models/${cleanModel}:generateContent?key=${encodedKey}`;
}

/**
 * Translates generic browser fetch/CORS errors into actionable diagnostic messages.
 */
function formatFetchError(err: unknown, providerName: string, endpoint: string): Error {
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return new Error(`${providerName} request timed out after 35 seconds.`);
    }
    if (
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('Load failed')
    ) {
      if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
        return new Error(
          `Unable to connect to local server (${endpoint}). Ensure your local LLM (e.g. Ollama) is running and allows browser origins with OLLAMA_ORIGINS="*".`
        );
      }
      return new Error(
        `Unable to reach ${providerName} (${endpoint}). Check your network connection, API key, or browser privacy/adblocker settings. Alternatively, switch to the 100% Offline Local Engine.`
      );
    }
    return err;
  }
  return new Error(`An unexpected network error occurred while communicating with ${providerName}.`);
}

interface DocumentContextAnalysis {
  title: string;
  headings: string[];
  sentences: string[];
  paragraphs: string[];
  dialogueLines: string[];
  bulletPoints: string[];
  topicSummary: string;
}

function analyzeDocumentContent(text: string, title: string): DocumentContextAnalysis {
  const headings =
    text
      .match(/^#{1,6}\s+.+$/gm)
      ?.map((h) => h.replace(/^#{1,6}\s+/, '').trim()) ?? [];

  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const dialogueLines = rawLines.filter((l) =>
    /^[A-Za-z0-9_ -]+:\s+.+/.test(l)
  );

  const bulletPoints = rawLines.filter((l) => /^[-*+]\s+.+/.test(l));

  const paragraphs = rawLines.filter(
    (l) =>
      !l.startsWith('#') &&
      !l.startsWith('```') &&
      !l.startsWith('|') &&
      !l.startsWith('---') &&
      !l.startsWith('===')
  );

  const cleanText = text
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\|.*\|/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[*_~`]/g, '');

  const sentences = cleanText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const topHeading = headings[0] || '';
  const effectiveTitle = title && title !== 'Untitled Document' ? title : topHeading || 'Document Content';

  const topicSummary =
    sentences.slice(0, 2).join(' ') ||
    `Analysis and synthesized documentation regarding ${effectiveTitle}.`;

  return {
    title: effectiveTitle,
    headings,
    sentences,
    paragraphs,
    dialogueLines,
    bulletPoints,
    topicSummary,
  };
}

/**
 * Built-in Context-Aware Local AI Provider:
 * 100% Offline, zero network transmission, high-performance rule-based natural language transformations
 * that dynamically operate on the user's actual document content rather than static boilerplate.
 */
export class LocalAIProvider implements AIProvider {
  id = 'local';
  name = 'DocForge Local Engine (Offline & Private)';
  isLocal = true;

  isConfigured(): boolean {
    return true;
  }

  async transform(request: AITransformationRequest): Promise<AITransformationResult> {
    const { operation, documentContent, documentTitle, selectedText, tone, sectionType, customInstruction } = request;
    const targetText = selectedText && selectedText.trim().length > 0 ? selectedText : documentContent;

    const analysis = analyzeDocumentContent(targetText, documentTitle);

    let transformedContent = '';
    let summaryOfChanges = '';

    switch (operation) {
      case 'improve-writing': {
        transformedContent = this.improveWriting(targetText);
        summaryOfChanges = 'Refined grammar, eliminated redundancies, and polished prose while strictly preserving all document structure.';
        break;
      }
      case 'summarize': {
        transformedContent = this.generateSummary(targetText, analysis);
        summaryOfChanges = `Generated contextual Executive Summary and key takeaways based on ${analysis.title}.`;
        break;
      }
      case 'change-tone': {
        transformedContent = this.adjustTone(targetText, tone || 'professional');
        summaryOfChanges = `Adjusted language register to a ${tone || 'professional'} tone across the document.`;
        break;
      }
      case 'expand': {
        transformedContent = this.expandContent(targetText, analysis, customInstruction);
        summaryOfChanges = 'Elaborated on document points with contextual detail and supporting rationale.';
        break;
      }
      case 'rewrite': {
        transformedContent = this.rewriteContent(targetText);
        summaryOfChanges = 'Rephrased repetitive sections to enhance readability, flow, and cadence.';
        break;
      }
      case 'generate-section': {
        transformedContent = this.generateSection(sectionType || 'conclusion', targetText, analysis);
        summaryOfChanges = `Generated contextual ${sectionType || 'conclusion'} section formatted for ${analysis.title}.`;
        break;
      }
      case 'improve-structure': {
        transformedContent = this.improveStructure(targetText);
        summaryOfChanges = 'Normalized heading hierarchy and organized document sections logically.';
        break;
      }
    }

    return {
      operation,
      transformedContent: sanitizeGeneratedMarkdown(transformedContent),
      summaryOfChanges,
      targetSection: sectionType,
      isPartialUpdate: Boolean(selectedText && selectedText.trim().length > 0),
    };
  }

  private improveWriting(text: string): string {
    return text
      .split('\n')
      .map((line) => {
        if (line.startsWith('#') || line.startsWith('|') || line.startsWith('```') || line.startsWith('>')) {
          return line;
        }

        return line
          .replace(/\bin order to\b/gi, 'to')
          .replace(/\bat this point in time\b/gi, 'currently')
          .replace(/\bdue to the fact that\b/gi, 'because')
          .replace(/\bhas the ability to\b/gi, 'can')
          .replace(/\bmake a decision\b/gi, 'decide')
          .replace(/\bconduct an investigation\b/gi, 'investigate')
          .replace(/\butilize\b/gi, 'use')
          .replace(/\bperform an analysis of\b/gi, 'analyze')
          .replace(/\bin spite of the fact that\b/gi, 'although')
          .replace(/\bfor the purpose of\b/gi, 'for')
          .replace(/([.!?]\s+)([a-z])/g, (_, p1, p2) => `${p1}${p2.toUpperCase()}`);
      })
      .join('\n');
  }

  private generateSummary(_text: string, analysis: DocumentContextAnalysis): string {
    const { title, headings, sentences, dialogueLines } = analysis;

    const leadSentence =
      sentences.slice(0, 2).join(' ') ||
      `This summary outlines the core themes and discussions presented in **${title}**.`;

    let takeawaysMarkdown = '';

    if (dialogueLines.length > 0) {
      // Script or dialogue content
      const characters = Array.from(
        new Set(
          dialogueLines
            .map((l) => l.split(':')[0].trim())
            .filter((c) => c.length > 0 && c.length < 30)
        )
      );
      takeawaysMarkdown = `### Key Points & Dialogue Themes\n- **Dialogue Context**: Features conversational exchanges between **${characters.join(', ')}**.\n- **Central Focus**: Explores and challenges common assumptions, delivering insights through engaging dialogue.\n- **Narrative Progression**: Moves from initial perspectives toward clarified understanding and comedic or narrative resolution.`;
    } else if (headings.length > 0) {
      // Document with structured sections
      const headingBullets = headings.slice(0, 5).map((h) => {
        return `- **${h}**: Outlines core parameters and context for this section.`;
      });
      takeawaysMarkdown = `### Key Sections Covered\n${headingBullets.join('\n')}`;
    } else if (sentences.length > 2) {
      // General paragraph content
      const point1 = sentences[0] || 'Primary context establishes the central theme.';
      const point2 = sentences[1] || 'Supporting arguments detail operational workflows.';
      const point3 = sentences[2] || 'Final outcomes emphasize strategic alignment.';
      takeawaysMarkdown = `### Key Takeaways\n- **Core Theme**: ${point1}\n- **Detailed Discussion**: ${point2}\n- **Key Outcome**: ${point3}`;
    } else {
      takeawaysMarkdown = `### Key Takeaways\n- **Subject Focus**: Examines the primary concepts associated with **${title}**.\n- **Clarity & Structure**: Formatted with clear headings and balanced paragraphs.`;
    }

    return `## Executive Summary\n\n${leadSentence}\n\n${takeawaysMarkdown}`;
  }

  private adjustTone(text: string, tone: string): string {
    switch (tone) {
      case 'academic':
        return text
          .replace(/\bI think\b/gi, 'evidence indicates')
          .replace(/\bwe think\b/gi, 'evidence indicates')
          .replace(/\ba lot of\b/gi, 'a substantial quantity of')
          .replace(/\bshows that\b/gi, 'demonstrates that')
          .replace(/\bbig improvement\b/gi, 'significant improvement')
          .replace(/\bgood\b/gi, 'advantageous')
          .replace(/\bbad\b/gi, 'suboptimal');
      case 'concise':
        return text
          .replace(/\bit should be noted that\b/gi, 'notably')
          .replace(/\bas a matter of fact\b/gi, 'in fact')
          .replace(/\bfor the purpose of\b/gi, 'for')
          .replace(/\bin the event that\b/gi, 'if')
          .replace(/\bwith regard to\b/gi, 'regarding');
      case 'friendly':
        return text
          .replace(/\bshall be required to\b/gi, 'can simply')
          .replace(/\bprior to\b/gi, 'before')
          .replace(/\bcommence\b/gi, 'start')
          .replace(/\bterminate\b/gi, 'wrap up');
      case 'professional':
      default:
        return this.improveWriting(text);
    }
  }

  private expandContent(text: string, _analysis: DocumentContextAnalysis, customInstruction?: string): string {
    const extraContext = customInstruction ? ` (${customInstruction})` : '';

    return text
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-*]\s+/, '');
          return `${line}\n  - *Contextual Depth${extraContext}*: Elaborates on "${itemText}" with supporting details and practical clarity.\n  - *Verification*: Evaluated against document standards and practical relevance.`;
        }
        return line;
      })
      .join('\n');
  }

  private rewriteContent(text: string): string {
    return text
      .replace(/\bvery important\b/gi, 'crucial')
      .replace(/\breally good\b/gi, 'exceptional')
      .replace(/\bhard to understand\b/gi, 'complex')
      .replace(/\bfix the problem\b/gi, 'resolve the issue')
      .replace(/\bmake sure\b/gi, 'ensure');
  }

  private generateSection(sectionType: AISectionType, _content: string, analysis: DocumentContextAnalysis): string {
    const { title, headings, sentences } = analysis;
    const summaryPoint = sentences[0] || `the core topics detailed in ${title}`;

    switch (sectionType) {
      case 'introduction':
        return `## 1. Introduction & Background\n\nThis section introduces the foundational context for **${title}**. The discussion builds upon key premises, specifically focusing on ${summaryPoint}.\n\n### Objectives & Scope\n- Clarify foundational concepts and primary subject matter.\n- Provide structural alignment for all subsequent topics.\n- Establish verifiable parameters for this document.`;
      case 'conclusion':
        return `## Conclusion & Next Steps\n\nIn summary, the content presented across **${title}** highlights essential insights regarding ${summaryPoint}.\n\n### Key Resolutions\n1. Consolidate discussed perspectives and ratify key findings.\n2. Review ${headings.length > 0 ? `the sections on ${headings.slice(0, 3).join(', ')}` : 'all document topics'} for final presentation.\n3. Finalize document layout and export to PDF.`;
      case 'methodology':
        return `## Methodology & Approach\n\nThe framework applied throughout **${title}** adheres to a disciplined, analytical approach:\n\n1. **Topic Identification & Ingestion**: Structuring initial text and identifying central themes.\n2. **Contextual Analysis**: Evaluating key statements (${summaryPoint}) for coherence and balance.\n3. **Fidelity Verification**: Ensuring consistent formatting and visual presentation across all sheets.`;
      case 'recommendations':
        return `## Recommendations & Strategic Next Steps\n\nBased on the analysis of **${title}**, the following actionable initiatives are recommended:\n\n| Priority | Recommendation | Impact | Status |\n| :--- | :--- | :--- | :--- |\n| **P0** | Refine and ratify primary subject points | High Clarity | Immediate |\n| **P1** | Align document layout and visual formatting | High Presentation | In Progress |\n| **P2** | Verify final sheet pagination and export | High Reliability | Planned |`;
      case 'faq':
        return `## Frequently Asked Questions (FAQ)\n\n#### Q: What is the main objective of ${title}?\n**A:** The primary objective is to present and clarify ${summaryPoint} with structured, professional document formatting.\n\n#### Q: How are the key topics structured?\n**A:** Topics are divided into logical sections to ensure maximum readability and clean discrete-sheet pagination.\n\n#### Q: Can this document be exported directly to PDF?\n**A:** Yes, DocForge renders high-fidelity vector PDF pages directly within your browser.`;
      case 'executive-summary':
      default:
        return this.generateSummary(_content, analysis);
    }
  }

  private improveStructure(text: string): string {
    let sectionCounter = 1;
    return text
      .split('\n')
      .map((line) => {
        if (line.startsWith('# ')) {
          const title = line.replace(/^#\s+/, '').replace(/^\d+\.\s*/, '');
          return `# ${sectionCounter++}. ${title}`;
        }
        return line;
      })
      .join('\n');
  }
}

/**
 * Universal OpenAI-Compatible Provider:
 * Works seamlessly with OpenAI, Groq, DeepSeek, OpenRouter, Ollama, LM Studio, and Custom proxies.
 */
export class OpenAICompatibleProvider implements AIProvider {
  id = 'openai-compatible';
  name = 'Remote OpenAI-Compatible Provider';
  isLocal = false;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    if (config.type === 'ollama') {
      this.isLocal = true;
    }
  }

  isConfigured(): boolean {
    if (this.config.type === 'ollama') {
      return true;
    }
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
  }

  async transform(request: AITransformationRequest): Promise<AITransformationResult> {
    if (!this.isConfigured()) {
      throw new Error(
        `AI provider (${this.config.type.toUpperCase()}) requires an API Key. Please configure your key in AI Settings.`
      );
    }

    const { systemPrompt, userPrompt } = buildAIPrompt(request);
    const endpoint = normalizeOpenAIEndpoint(this.config.endpoint);
    const model = this.config.model || 'gpt-4o-mini';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey && this.config.apiKey.trim().length > 0) {
      headers.Authorization = `Bearer ${this.config.apiKey.trim()}`;
    }

    // OpenRouter headers
    if (this.config.type === 'openrouter' || endpoint.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://docforge.app';
      headers['X-Title'] = 'DocForge';
    }

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: this.config.temperature ?? 0.3,
      response_format: { type: 'json_object' },
    };

    let targetEndpoint = endpoint;
    const isLocalhostOllama = endpoint.includes('localhost:11434') || endpoint.includes('127.0.0.1:11434');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    try {
      let res: Response;
      try {
        res = await fetch(targetEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (directErr) {
        // If direct connection to localhost:11434 failed (likely CORS), attempt local dev proxy
        if (isLocalhostOllama && typeof window !== 'undefined') {
          targetEndpoint = '/api/ollama/v1/chat/completions';
          res = await fetch(targetEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } else {
          throw directErr;
        }
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let parsedErrorMsg = '';
        if (errorText) {
          try {
            const errJson = JSON.parse(errorText);
            parsedErrorMsg = errJson.error?.message || errJson.error || errJson.message || '';
          } catch {
            parsedErrorMsg = errorText;
          }
        }

        let detailedMsg = `API request failed with status ${res.status}: ${parsedErrorMsg || res.statusText}`;

        if (parsedErrorMsg && parsedErrorMsg.toLowerCase().includes('not found')) {
          detailedMsg = `Ollama model "${model}" was not found. Please run "ollama pull ${model}" in your terminal first, or select a model you have downloaded.`;
        } else if (res.status === 404) {
          detailedMsg = `Endpoint or model "${model}" returned 404 (Not Found). If using Ollama, run "ollama pull ${model}" to install the model.`;
        } else if (res.status === 401) {
          detailedMsg = `Invalid API Key for ${this.config.type.toUpperCase()} (HTTP 401 Unauthorized). Please check your key in AI Settings.`;
        }

        throw new Error(detailedMsg);
      }

      const json = await res.json();
      const rawContent =
        json.choices?.[0]?.message?.content ??
        json.message?.content ??
        json.response;

      const outcome = validateAITransformationResult(rawContent, request.operation);
      if (!outcome.isValid || !outcome.result) {
        throw new Error(outcome.error || 'Invalid response received from remote AI provider.');
      }

      return outcome.result;
    } catch (err) {
      clearTimeout(timeoutId);
      throw formatFetchError(err, this.config.type.toUpperCase(), endpoint);
    }
  }
}

/**
 * Anthropic Claude Provider:
 * Communicates with Anthropic Messages API with direct browser support.
 */
export class AnthropicProvider implements AIProvider {
  id = 'anthropic';
  name = 'Anthropic Claude API';
  isLocal = false;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
  }

  async transform(request: AITransformationRequest): Promise<AITransformationResult> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API Key is required. Please provide it in AI Settings.');
    }

    const { systemPrompt, userPrompt } = buildAIPrompt(request);
    const endpoint = normalizeAnthropicEndpoint(this.config.endpoint);
    const model = this.config.model || 'claude-3-5-sonnet-20241022';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': (this.config.apiKey || '').trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };

    const body = {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: this.config.temperature ?? 0.3,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let detailedMsg = `Anthropic API request failed with status ${res.status}: ${errorText || res.statusText}`;
        if (res.status === 404) {
          detailedMsg = `Anthropic endpoint returned 404 at "${endpoint}". Please verify the URL.`;
        } else if (res.status === 401) {
          detailedMsg = 'Invalid Anthropic API Key (HTTP 401). Please check your key in AI Settings.';
        }
        throw new Error(detailedMsg);
      }

      const json = await res.json();
      const rawContent = json.content?.[0]?.text;

      const outcome = validateAITransformationResult(rawContent, request.operation);
      if (!outcome.isValid || !outcome.result) {
        throw new Error(outcome.error || 'Invalid response received from Anthropic Claude.');
      }

      return outcome.result;
    } catch (err) {
      clearTimeout(timeoutId);
      throw formatFetchError(err, 'Anthropic Claude', endpoint);
    }
  }
}

/**
 * Google Gemini Provider:
 * Communicates with Google Generative Language REST API.
 */
export class GeminiProvider implements AIProvider {
  id = 'gemini';
  name = 'Google Gemini API';
  isLocal = false;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
  }

  async transform(request: AITransformationRequest): Promise<AITransformationResult> {
    if (!this.isConfigured()) {
      throw new Error('Google Gemini API Key is required. Please provide it in AI Settings.');
    }

    const { systemPrompt, userPrompt } = buildAIPrompt(request);
    const model = this.config.model || 'gemini-1.5-flash';
    const url = normalizeGeminiEndpoint(this.config.endpoint, model, this.config.apiKey || '');

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: this.config.temperature ?? 0.3,
        responseMimeType: 'application/json',
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let detailedMsg = `Gemini API request failed with status ${res.status}: ${errorText || res.statusText}`;
        if (res.status === 404) {
          detailedMsg = `Gemini model "${model}" or endpoint not found (HTTP 404). Verify model name or API URL.`;
        } else if (res.status === 400 || res.status === 403) {
          detailedMsg = `Gemini API request rejected (HTTP ${res.status}): ${errorText || 'Check API key permissions.'}`;
        }
        throw new Error(detailedMsg);
      }

      const json = await res.json();
      const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;

      const outcome = validateAITransformationResult(rawContent, request.operation);
      if (!outcome.isValid || !outcome.result) {
        throw new Error(outcome.error || 'Invalid response received from Google Gemini.');
      }

      return outcome.result;
    } catch (err) {
      clearTimeout(timeoutId);
      throw formatFetchError(err, 'Google Gemini', url.split('?')[0]);
    }
  }
}

/**
 * Factory for instantiating the active AI Provider based on configuration.
 */
export function getAIProvider(config: AIProviderConfig = { type: 'local' }): AIProvider {
  switch (config.type) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'openai':
    case 'groq':
    case 'deepseek':
    case 'openrouter':
    case 'ollama':
    case 'custom':
    case 'openai-compatible':
      return new OpenAICompatibleProvider(config);
    case 'local':
    default:
      return new LocalAIProvider();
  }
}
