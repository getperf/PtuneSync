export interface OpenAIEmbeddingItem {
  embedding: number[];
  index: number;
}

export interface OpenAIEmbeddingResponse {
  data: OpenAIEmbeddingItem[];
}
