export type BrandVoiceRAG = {
  /** Generate an answer grounded in the brand voice docs. */
  ask(query: string, options?: { topK?: number }): Promise<string>;
  /** Files NeuroLink loads on each call. */
  readonly files: string[];
};
