/**
 * DocForge Phase 16 — Universal Multi-Provider AI Architecture
 * Type definitions for AI operations, request/result contracts, and multi-provider configs.
 */

export type AIOperationType =
  | 'improve-writing'
  | 'summarize'
  | 'change-tone'
  | 'expand'
  | 'rewrite'
  | 'generate-section'
  | 'improve-structure';

export type AITone = 'professional' | 'academic' | 'concise' | 'friendly';

export type AISectionType =
  | 'introduction'
  | 'conclusion'
  | 'executive-summary'
  | 'methodology'
  | 'recommendations'
  | 'faq';

export interface AITransformationRequest {
  operation: AIOperationType;
  documentContent: string;
  documentTitle: string;
  selectedText?: string;
  tone?: AITone;
  sectionType?: AISectionType;
  customInstruction?: string;
}

export interface AITransformationResult {
  operation: AIOperationType;
  transformedContent: string;
  summaryOfChanges: string;
  targetSection?: string;
  suggestedTitle?: string;
  isPartialUpdate?: boolean;
}

export type AIProviderType =
  | 'local'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'deepseek'
  | 'openrouter'
  | 'ollama'
  | 'custom'
  | 'openai-compatible'; // legacy fallback alias

export interface AIProviderConfig {
  type: AIProviderType;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface ProviderPresetInfo {
  id: AIProviderType;
  name: string;
  badge: string;
  defaultEndpoint: string;
  defaultModel: string;
  placeholderKey: string;
  isKeyRequired: boolean;
  isLocal: boolean;
  models: string[];
}

export const PROVIDER_PRESETS: Record<string, ProviderPresetInfo> = {
  local: {
    id: 'local',
    name: 'DocForge Local Engine',
    badge: '100% Offline',
    defaultEndpoint: '',
    defaultModel: 'docforge-local-rules-v1',
    placeholderKey: 'No API Key required (100% Offline)',
    isKeyRequired: false,
    isLocal: true,
    models: ['docforge-local-rules-v1'],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Official API',
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    placeholderKey: 'sk-proj-...',
    isKeyRequired: true,
    isLocal: false,
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini', 'gpt-3.5-turbo'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude API',
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
    placeholderKey: 'sk-ant-api03-...',
    isKeyRequired: true,
    isLocal: false,
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini API',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-flash',
    placeholderKey: 'AIzaSy...',
    isKeyRequired: true,
    isLocal: false,
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra Fast',
    defaultEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    placeholderKey: 'gsk_...',
    isKeyRequired: true,
    isLocal: false,
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'DeepSeek V3 / R1',
    defaultEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    placeholderKey: 'sk-...',
    isKeyRequired: true,
    isLocal: false,
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '200+ Models',
    defaultEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    placeholderKey: 'sk-or-v1-...',
    isKeyRequired: true,
    isLocal: false,
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o-mini',
      'deepseek/deepseek-chat',
      'google/gemini-flash-1.5',
    ],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama / Local LLM',
    badge: 'Self-Hosted',
    defaultEndpoint: 'http://localhost:11434/v1/chat/completions',
    defaultModel: 'llama3:latest',
    placeholderKey: 'Not required for local Ollama',
    isKeyRequired: false,
    isLocal: true,
    models: ['llama3:latest', 'mistral:latest', 'phi3:latest', 'qwen2.5:latest'],
  },
  custom: {
    id: 'custom',
    name: 'Custom Endpoint',
    badge: 'OpenAI Protocol',
    defaultEndpoint: 'https://your-custom-llm-proxy.com/v1/chat/completions',
    defaultModel: 'default-model',
    placeholderKey: 'Custom API Key or Bearer Token',
    isKeyRequired: false,
    isLocal: false,
    models: ['default-model'],
  },
};

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  type: 'local',
  model: 'docforge-local-rules-v1',
  temperature: 0.3,
};
