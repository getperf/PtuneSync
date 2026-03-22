export type OpenAiModelProfile = {
  usesResponsesApi: boolean;
  supportsTemperature: boolean;
  reasoningEffort?: "none" | "minimal";
};

export class OpenAiModelProfileResolver {
  static resolve(model: string): OpenAiModelProfile {
    if (!model.startsWith("gpt-5")) {
      return {
        usesResponsesApi: true,
        supportsTemperature: true,
      };
    }

    return {
      usesResponsesApi: true,
      supportsTemperature: false,
      reasoningEffort:
        model.startsWith("gpt-5.1") || model.startsWith("gpt-5.2")
          ? "none"
          : "minimal",
    };
  }
}
