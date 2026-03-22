// src/core/services/llm/LlmProviders.ts

export type LlmProviderKey = 'openai' | 'claude' | 'gemini';

export type LlmProviderSpec = {
  label: string;
  models: readonly string[];
  embeddingModels?: readonly string[];
  supportsEmbedding: boolean;
};

export const LLM_PROVIDERS: Record<LlmProviderKey, LlmProviderSpec> = {
  openai: {
    label: 'OpenAI',
    models: ['gpt-4.1', 'gpt-4o-mini'],
    embeddingModels: ['text-embedding-3-small', 'text-embedding-3-large'],
    supportsEmbedding: true,
  },

  claude: {
    label: 'Claude',
    models: ['claude-3-5-haiku', 'claude-3-5-sonnet'],
    supportsEmbedding: false,
  },

  gemini: {
    label: 'Gemini',
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    supportsEmbedding: false,
  },
} as const;
