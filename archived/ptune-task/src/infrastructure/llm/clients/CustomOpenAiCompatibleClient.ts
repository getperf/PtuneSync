import { requestUrl } from "obsidian";
import type { LlmSettings } from "../../../config/types";
import { logger } from "../../../shared/logger/loggerInstance";
import { formatRequestError } from "../shared/formatRequestError";
import type { ProviderTextGenerator } from "./ProviderTextGenerator";

export class CustomOpenAiCompatibleClient implements ProviderTextGenerator {
  async generate(system: string, user: string, settings: LlmSettings): Promise<string | null> {
    try {
      const res = await requestUrl({
        url: `${settings.baseUrl}/chat/completions`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: settings.model,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`OpenAI-compatible API error: ${res.status}`);
      }

      return res.json?.choices?.[0]?.message?.content ?? null;
    } catch (error) {
      const message = formatRequestError("OpenAI-compatible API", error);
      logger.warn("[Service] CustomOpenAiCompatibleClient.generate rawError", error);
      logger.warn(`[Service] CustomOpenAiCompatibleClient.generate failed ${message}`);
      throw new Error(message);
    }
  }
}
