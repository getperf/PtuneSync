import { requestUrl } from "obsidian";
import type { LlmSettings } from "../../../config/types";
import { logger } from "../../../shared/logger/loggerInstance";
import { OpenAiModelProfileResolver } from "../openai/OpenAiModelProfile";
import { extractResponsesText } from "../shared/extractResponsesText";
import { formatRequestError } from "../shared/formatRequestError";
import type { ProviderTextGenerator } from "./ProviderTextGenerator";

export class OpenAiClient implements ProviderTextGenerator {
  private static readonly MAX_ATTEMPTS = 2;

  async generate(system: string, user: string, settings: LlmSettings): Promise<string | null> {
    const profile = OpenAiModelProfileResolver.resolve(settings.model);
    return profile.usesResponsesApi
      ? await this.callResponsesApi(system, user, settings, profile)
      : await this.callChatCompletions(system, user, settings);
  }

  private async callResponsesApi(
    system: string,
    user: string,
    settings: LlmSettings,
    profile: ReturnType<typeof OpenAiModelProfileResolver.resolve>,
  ): Promise<string | null> {
    const payload: Record<string, unknown> = {
      model: settings.model,
      instructions: system,
      input: user,
      max_output_tokens: settings.maxTokens,
      text: {
        verbosity: "low",
      },
    };

    if (profile.supportsTemperature) {
      payload.temperature = settings.temperature;
    } else if (profile.reasoningEffort) {
      payload.reasoning = {
        effort: profile.reasoningEffort,
      };
    }

    const body = JSON.stringify(payload);
    logger.debug(
      `[Service] OpenAiClient.callResponsesApi requestBytes=${body.length} model=${settings.model}`,
    );

    return await this.withRetry(
      "OpenAI Responses API",
      async () => {
        const res = await requestUrl({
          url: `${settings.baseUrl}/responses`,
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            "Content-Type": "application/json",
          },
          body,
        });

        return extractResponsesText(res.json);
      },
    );
  }

  private async callChatCompletions(
    system: string,
    user: string,
    settings: LlmSettings,
  ): Promise<string | null> {
    const body = JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    logger.debug(
      `[Service] OpenAiClient.callChatCompletions requestBytes=${body.length} model=${settings.model}`,
    );

    return await this.withRetry(
      "OpenAI-compatible API",
      async () => {
        const res = await requestUrl({
          url: `${settings.baseUrl}/chat/completions`,
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            "Content-Type": "application/json",
          },
          body,
        });

        if (res.status < 200 || res.status >= 300) {
          throw new Error(`OpenAI-compatible API error: ${res.status}`);
        }

        return res.json?.choices?.[0]?.message?.content ?? null;
      },
    );
  }

  private async withRetry(
    label: string,
    action: () => Promise<string | null>,
  ): Promise<string | null> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= OpenAiClient.MAX_ATTEMPTS; attempt += 1) {
      logger.debug(
        `[Service] OpenAiClient.withRetry start label=${label} attempt=${attempt}/${OpenAiClient.MAX_ATTEMPTS}`,
      );

      try {
        return await action();
      } catch (error) {
        lastError = error;
        const status = this.readStatus(error);
        const retryable = this.isRetryable(error);
        const message = formatRequestError(label, error);

        logger.warn("[Service] OpenAiClient.withRetry rawError", error);
        logger.warn(
          `[Service] OpenAiClient.withRetry failed label=${label} attempt=${attempt}/${OpenAiClient.MAX_ATTEMPTS} status=${status ?? "unknown"} retryable=${retryable} message=${message}`,
        );

        if (!retryable || attempt >= OpenAiClient.MAX_ATTEMPTS) {
          throw new Error(message);
        }

        const delayMs = attempt === 1 ? 200 : 600;
        logger.warn(
          `[Service] OpenAiClient.withRetry retrying label=${label} nextAttempt=${attempt + 1} delayMs=${delayMs}`,
        );
        await this.sleep(delayMs);
      }
    }

    throw new Error(formatRequestError(label, lastError));
  }

  private isRetryable(error: unknown): boolean {
    const status = this.readStatus(error);
    if (status === null) {
      return true;
    }

    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  }

  private readStatus(error: unknown): number | null {
    if (!error || typeof error !== "object") {
      return null;
    }

    const value = (error as Record<string, unknown>).status;
    return typeof value === "number" ? value : null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}
