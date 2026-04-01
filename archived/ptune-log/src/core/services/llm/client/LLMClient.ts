import { App } from 'obsidian';
import { OpenAIClient } from './clients/OpenAIClient';
import { GeminiClient } from './clients/GeminiClient';
import { ClaudeClient } from './clients/ClaudeClient';
import { LLMClientError } from './clients/LLMClientError';
import { TagVectors } from 'src/core/models/vectors/TagVectors';
import { LLMSettings } from 'src/config/settings/LLMSettings';
import { LLMClientBase } from './clients/LLMClientBase';
import { logger } from '../../logger/loggerInstance';

/** LLMサービスの統合クライアント */
export class LLMClient {
  constructor(private app: App, public settings: LLMSettings) {}

  hasValidApiKey(): boolean {
    return !!this.settings.apiKey?.trim();
  }

  /** Embedding機能が利用可能かを判定 */
  hasEmbeddingModel(): boolean {
    const { embeddingModel } = this.settings;
    return !!(
      embeddingModel &&
      embeddingModel.trim().length > 0 &&
      this.hasValidApiKey()
    );
  }

  /** ベクトルDBが存在するか */
  hasVectorDB(): boolean {
    const path = TagVectors.getVectorDbPath();
    const file = this.app.vault.getAbstractFileByPath(path);
    return !!file;
  }

  /** Embedding非対応時は例外を送出 */
  ensureEmbeddingSupported(): void {
    if (!this.hasEmbeddingModel()) {
      logger.warn('[LLMClient] embeddingModel not configured or unsupported');
      throw new LLMClientError(
        'このプロバイダーは Embedding 非対応です。OpenAI Chat を使用してください。'
      );
    }
  }

  /** Embedding検索が利用可能か */
  isVectorSearchAvailable(): boolean {
    logger.debug('[LLMClient] check vector search available');
    if (!this.hasEmbeddingModel()) return false;
    return this.hasVectorDB();
  }

  /** Chat補完実行 */
  async complete(system: string, user: string): Promise<string | null> {
    const client = this.createClient();
    try {
      return await client.callChat(system, user);
    } catch (e) {
      logger.error('[LLMClient.complete] failed', e);
      return null;
    }
  }

  /** Embedding生成（単文） */
  async embed(input: string): Promise<number[] | null> {
    this.ensureEmbeddingSupported();
    const client = this.createClient();
    try {
      return await client.callEmbedding(input);
    } catch (e) {
      logger.error('[LLMClient.embed] failed', e);
      return null;
    }
  }

  /** Embedding生成（複数テキスト一括） */
  async embedBatch(inputs: string[]): Promise<number[][]> {
    this.ensureEmbeddingSupported();
    const client = this.createClient();

    if (!client.callEmbeddingBatch) {
      throw new LLMClientError('This client does not support batch embeddings');
    }

    try {
      return await client.callEmbeddingBatch(inputs);
    } catch (e) {
      logger.error('[LLMClient.embedBatch] failed', e);
      return [];
    }
  }

  /** モデル名からクライアント選択 */
  private createClient(): LLMClientBase {
    const model = this.settings.model ?? '';

    if (model.startsWith('gpt-') || model.startsWith('text-embedding'))
      return new OpenAIClient(this.settings);

    if (model.startsWith('gemini-')) return new GeminiClient(this.settings);

    if (model.startsWith('claude-')) return new ClaudeClient(this.settings);

    throw new LLMClientError(`Unsupported model: ${model}`);
  }
}
