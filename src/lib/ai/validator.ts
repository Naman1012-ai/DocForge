/**
 * DocForge Phase 16 — AI Result Validation & Sanitization Boundary
 * Validates structured JSON responses and sanitizes generated Markdown against dangerous tags.
 */

import type { AITransformationResult, AIOperationType } from '../../models/ai';

export interface ValidationOutcome {
  isValid: boolean;
  result?: AITransformationResult;
  error?: string;
}

/**
 * Sanitizes generated Markdown text to strip dangerous HTML vectors.
 */
export function sanitizeGeneratedMarkdown(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object, embed, form, input
    .replace(/<(object|embed|form|input)\b[^>]*>/gi, '')
    // Strip javascript: URLs
    .replace(/javascript:[^\s"'<>)]*/gi, '#unsafe-script-removed')
    // Strip inline onload, onerror, onclick handlers
    .replace(/\bon\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');
}

/**
 * Validates and extracts structured AITransformationResult from raw response strings.
 */
export function validateAITransformationResult(
  rawResponse: string | unknown,
  expectedOperation: AIOperationType
): ValidationOutcome {
  if (!rawResponse) {
    return {
      isValid: false,
      error: 'Empty or null response received from AI provider.',
    };
  }

  let parsed: Record<string, unknown> = {};

  if (typeof rawResponse === 'string') {
    let cleanJson = rawResponse.trim();
    // Strip markdown code fences if wrapped in ```json ... ```
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      // If parsing fails as JSON, verify if the response is plain markdown content
      if (cleanJson.length > 0) {
        return {
          isValid: true,
          result: {
            operation: expectedOperation,
            transformedContent: sanitizeGeneratedMarkdown(cleanJson),
            summaryOfChanges: `Transformed document content via ${expectedOperation}.`,
          },
        };
      }
      return {
        isValid: false,
        error: 'Failed to parse AI response into structured JSON format.',
      };
    }
  } else if (typeof rawResponse === 'object') {
    parsed = rawResponse as Record<string, unknown>;
  }

  const transformedContent = typeof parsed.transformedContent === 'string'
    ? parsed.transformedContent.trim()
    : typeof parsed.content === 'string'
    ? parsed.content.trim()
    : '';

  if (!transformedContent || transformedContent.length === 0) {
    return {
      isValid: false,
      error: 'AI response did not contain any valid transformed content.',
    };
  }

  const summaryOfChanges = typeof parsed.summaryOfChanges === 'string' && parsed.summaryOfChanges.trim().length > 0
    ? parsed.summaryOfChanges.trim()
    : `Completed ${expectedOperation} operation.`;

  const targetSection = typeof parsed.targetSection === 'string' ? parsed.targetSection.trim() : undefined;
  const suggestedTitle = typeof parsed.suggestedTitle === 'string' ? parsed.suggestedTitle.trim() : undefined;

  return {
    isValid: true,
    result: {
      operation: expectedOperation,
      transformedContent: sanitizeGeneratedMarkdown(transformedContent),
      summaryOfChanges,
      targetSection,
      suggestedTitle,
    },
  };
}
