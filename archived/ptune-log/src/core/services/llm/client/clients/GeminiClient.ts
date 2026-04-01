import { requestUrl } from 'obsidian';
import { LLMSettings } from 'src/config/settings/LLMSettings';
import { LLMClientError } from './LLMClientError';
import { LLMClientBase } from './LLMClientBase';
import { logger } from 'src/core/services/logger/loggerInstance';

/** Geminiモデルクライアント */
export class GeminiClient implements LLMClientBase {
  constructor(private settings: LLMSettings) {}

  async callChat(system: string, user: string): Promise<string | null> {
    const { apiKey, baseUrl, model, temperature, maxTokens } = this.settings;
    const url = `${baseUrl}/${model}:generateContent?key=${apiKey}`;

    const fullPrompt = `${system}\n\n${user}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    };

    logger.debug(`[GeminiClient.callChat] url=${url}`);

    try {
      const res = await requestUrl({
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status < 200 || res.status >= 300) {
        throw new LLMClientError(
          `Gemini Chat error: ${res.status} - ${res.text}`
        );
      }

      const text = res.json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      return text;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('[GeminiClient.callChat] failed', error);
      return null;
    }
  }

  callEmbedding(): never {
    throw new LLMClientError('Gemini embedding 未実装');
  }
}
