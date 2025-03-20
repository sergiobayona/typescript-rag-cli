import { openai } from '../utils/openai';

/**
 * Generate text embeddings using OpenAI's API
 * @param input - Text to embed
 * @returns Promise containing vector embedding
 */
export async function getTextEmbedding(input: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: input
  });
  
  return response.data[0].embedding;
}