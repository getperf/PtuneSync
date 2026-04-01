export interface TextGenerationPort {
  generate(system: string, user: string): Promise<string | null>;
  hasValidApiKey(): boolean;
}
