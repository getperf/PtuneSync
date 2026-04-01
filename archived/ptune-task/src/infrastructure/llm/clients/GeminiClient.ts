import { requestUrl } from "obsidian";
import type { LlmSettings } from "../../../config/types";
import { logger } from "../../../shared/logger/loggerInstance";
import { formatRequestError } from "../shared/formatRequestError";
import type { ProviderTextGenerator } from "./ProviderTextGenerator";

export class GeminiClient implements ProviderTextGenerator {
  async generate(system: string, user: string, settings: LlmSettings): Promise<string | null> {
    try {
      const res = await requestUrl({
        url: `${settings.baseUrl}/${settings.model}:generateContent?key=${settings.apiKey}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: `${system}\n\n${user}` }],
          }],
          generationConfig: {
            temperature: settings.temperature,
            maxOutputTokens: settings.maxTokens,
          },
        }),
      });

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Gemini API error: ${res.status}`);
      }

      return res.json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch (error) {
      const message = formatRequestError("Gemini API", error);
      logger.warn("[Service] GeminiClient.generate rawError", error);
      logger.warn(`[Service] GeminiClient.generate failed ${message}`);
      throw new Error(message);
    }
  }
}
