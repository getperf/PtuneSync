import { config } from "../../config/config";
import { TextGenerationPort } from "../../application/llm/ports/TextGenerationPort";
import { logger } from "../../shared/logger/loggerInstance";
import { ClaudeClient } from "./clients/ClaudeClient";
import { CustomOpenAiCompatibleClient } from "./clients/CustomOpenAiCompatibleClient";
import { GeminiClient } from "./clients/GeminiClient";
import { OpenAiClient } from "./clients/OpenAiClient";
import { ProviderTextGenerator } from "./clients/ProviderTextGenerator";

export class LlmClient implements TextGenerationPort {
  private readonly clients = new Map(configurableClients());

  hasValidApiKey(): boolean {
    return config.settings.llm.apiKey.trim().length > 0;
  }

  async generate(system: string, user: string): Promise<string | null> {
    const settings = config.settings.llm;
    const provider = settings.provider;

    logger.debug(`[Service] LlmClient.generate provider=${provider} model=${settings.model}`);
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    return await client.generate(system, user, settings);
  }
}

function configurableClients(): Array<[string, ProviderTextGenerator]> {
  return [
    ["openai", new OpenAiClient()],
    ["custom", new CustomOpenAiCompatibleClient()],
    ["gemini", new GeminiClient()],
    ["claude", new ClaudeClient()],
  ];
}
