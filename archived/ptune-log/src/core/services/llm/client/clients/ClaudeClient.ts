import { LLMSettings } from 'src/config/settings/LLMSettings';
import https from 'https';
import { LLMClientError } from './LLMClientError';
import { LLMClientBase } from './LLMClientBase';
import { logger } from 'src/core/services/logger/loggerInstance';

/** Claudeモデルクライアント */
export class ClaudeClient implements LLMClientBase {
  constructor(private settings: LLMSettings) {}

  /** Chat 呼び出し
   * 注意点:
   * - Obsidian プラグインは Node 環境で実行するため、グローバル fetch が使える。
   * - レンダラ環境 (app://obsidian.md) で呼ぶと CORS により失敗する。
   * - モデル名は短縮形ではなく、バージョン付きフルID
   *   例: "claude-3-5-haiku-20241022" を指定する必要がある。
   * - API キーはフロント側に露出しないよう注意すること。
   */
  async callChat(system: string, user: string): Promise<string | null> {
    const { apiKey, model, temperature, maxTokens } = this.settings;
    const body = JSON.stringify({
      model,
      temperature: temperature ?? 0.1,
      max_tokens: maxTokens ?? 1024,
      system,
      messages: [{ role: 'user', content: user }],
    });

    logger.debug(`[ClaudeClient.callChat] model=${model}`);

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                resolve(json.content?.[0]?.text ?? null);
              } catch (e) {
                reject(e instanceof Error ? e : new Error(String(e)));
              }
            } else {
              reject(
                new LLMClientError(
                  `Claude API error ${res.statusCode}: ${data}`
                )
              );
            }
          });
        }
      );

      req.on('error', (e) =>
        reject(e instanceof Error ? e : new Error(String(e)))
      );

      req.write(body);
      req.end();
    });
  }

  /** Embedding呼び出し（未実装） */
  callEmbedding(): Promise<number[] | null> {
    throw new LLMClientError('Claude embedding 未実装');
  }
}
