import { requestUrl } from 'obsidian';
import { LLMSettings } from 'src/config/settings/LLMSettings';
import { LLMClientError } from './LLMClientError';
import { LLMClientBase } from './LLMClientBase';
import type { OpenAIEmbeddingResponse } from './OpenAIResponse';
import { logger } from 'src/core/services/logger/loggerInstance';

/** OpenAI系モデル（Chat / Embedding） */
export class OpenAIClient implements LLMClientBase {
  constructor(private settings: LLMSettings) {}

  /** Chat 呼び出し */
  async callChat(system: string, user: string): Promise<string | null> {
    const { apiKey, baseUrl, model, temperature, maxTokens } = this.settings;
    logger.debug(`[OpenAIClient.callChat] model=${model}`);

    try {
      const res = await requestUrl({
        url: `${baseUrl}/chat/completions`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: temperature ?? 0.1,
          max_tokens: maxTokens ?? 1024,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });

      if (res.status < 200 || res.status >= 300) {
        throw new LLMClientError(
          `OpenAI Chat error: ${res.status} - ${res.text}`
        );
      }

      const content = res.json?.choices?.[0]?.message?.content ?? null;
      return content;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('[OpenAIClient.callChat] failed', e);
      return null;
    }
  }

  /** Embedding: 単文向け */
  async callEmbedding(input: string): Promise<number[] | null> {
    const { apiKey, baseUrl, embeddingModel } = this.settings;
    logger.debug('[OpenAIClient.callEmbedding] start');

    try {
      const res = await requestUrl({
        url: `${baseUrl}/embeddings`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: embeddingModel,
          input,
        }),
      });

      if (res.status < 200 || res.status >= 300) {
        throw new LLMClientError(
          `OpenAI Embedding error: ${res.status} - ${res.text}`
        );
      }

      const json = res.json as OpenAIEmbeddingResponse;
      return json.data?.[0]?.embedding ?? null;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('[OpenAIClient.callEmbedding] failed', e);
      return null;
    }
  }

  /** Embedding: バッチ */
  async callEmbeddingBatch(inputs: string[]): Promise<number[][]> {
    const { apiKey, baseUrl, embeddingModel } = this.settings;
    logger.debug(`[OpenAIClient.callEmbeddingBatch] count=${inputs.length}`);

    if (inputs.length === 0) return [];

    try {
      const res = await requestUrl({
        url: `${baseUrl}/embeddings`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: inputs,
        }),
      });

      if (res.status < 200 || res.status >= 300) {
        throw new LLMClientError(
          `EmbeddingBatch error ${res.status}: ${res.text}`
        );
      }

      const json = res.json as OpenAIEmbeddingResponse;
      const vectors = json.data.map((d) => d.embedding);

      logger.debug(
        `[OpenAIClient.callEmbeddingBatch] received ${vectors.length}`
      );

      return vectors;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('[OpenAIClient.callEmbeddingBatch] failed', e);
      return [];
    }
  }
}
