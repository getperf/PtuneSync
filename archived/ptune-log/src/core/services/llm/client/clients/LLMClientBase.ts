export interface LLMClientBase {
  callChat(system: string, user: string): Promise<string | null>;
  callEmbedding(input: string): Promise<number[] | null>;
  // Optional method
  callEmbeddingBatch?(inputs: string[]): Promise<number[][]>;
}
