import type { LlmSettings } from "../../../config/types";

export interface ProviderTextGenerator {
  generate(system: string, user: string, settings: LlmSettings): Promise<string | null>;
}
