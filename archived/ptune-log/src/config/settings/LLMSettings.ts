export interface LLMSettings {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string; // Chat用
  embeddingModel: string; // Embedding用
  temperature: number;
  maxTokens: number;
  minSimilarityScore: number; // 類似タグ検索のスコア閾値
  enableChecklist: boolean;
}

export const providerDefaults: Record<string, Partial<LLMSettings>> = {
  'OpenAI Chat': {
    model: 'gpt-4.1-mini',
    embeddingModel: 'text-embedding-3-small',
    baseUrl: 'https://api.openai.com/v1',
    temperature: 0.2,
    maxTokens: 1024,
    minSimilarityScore: 0.5,
  },
  Gemini: {
    model: 'gemini-2.5-flash-lite',
    embeddingModel: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    temperature: 0.2,
    maxTokens: 2048,
    minSimilarityScore: 0.5,
  },
  'Anthropic Claude': {
    model: 'claude-3-5-haiku-20241022',
    embeddingModel: '',
    baseUrl: 'https://api.anthropic.com/v1',
    temperature: 0.2,
    maxTokens: 1024,
    minSimilarityScore: 0.5,
  },
  Custom: {
    model: '',
    embeddingModel: '',
    baseUrl: '',
    temperature: 0.2,
    maxTokens: 1024,
    minSimilarityScore: 0.5,
  },
};
