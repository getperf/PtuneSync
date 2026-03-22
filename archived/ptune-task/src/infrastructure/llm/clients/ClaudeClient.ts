import https from "node:https";
import type { LlmSettings } from "../../../config/types";
import { logger } from "../../../shared/logger/loggerInstance";
import { formatRequestError } from "../shared/formatRequestError";
import type { ProviderTextGenerator } from "./ProviderTextGenerator";

export class ClaudeClient implements ProviderTextGenerator {
  async generate(system: string, user: string, settings: LlmSettings): Promise<string | null> {
    try {
      return await new Promise<string | null>((resolve, reject) => {
        const body = JSON.stringify({
          model: settings.model,
          system,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          messages: [{ role: "user", content: user }],
        });

        const req = https.request(
          {
            hostname: "api.anthropic.com",
            path: "/v1/messages",
            method: "POST",
            headers: {
              "x-api-key": settings.apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
              "content-length": Buffer.byteLength(body),
            },
          },
          (res) => {
            let data = "";

            res.on("data", (chunk) => {
              data += chunk;
            });

            res.on("end", () => {
              if ((res.statusCode ?? 500) >= 300) {
                reject(new Error(`Claude API error: ${res.statusCode ?? 500}`));
                return;
              }

              try {
                const json = JSON.parse(data) as {
                  content?: Array<{ text?: string }>;
                };
                resolve(json.content?.[0]?.text ?? null);
              } catch (error) {
                reject(error);
              }
            });
          },
        );

        req.on("error", reject);
        req.write(body);
        req.end();
      });
    } catch (error) {
      const message = formatRequestError("Claude API", error);
      logger.warn("[Service] ClaudeClient.generate rawError", error);
      logger.warn(`[Service] ClaudeClient.generate failed ${message}`);
      throw new Error(message);
    }
  }
}
