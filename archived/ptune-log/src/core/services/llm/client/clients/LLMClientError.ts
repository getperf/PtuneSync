export class LLMClientError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'LLMClientError';
  }
}
