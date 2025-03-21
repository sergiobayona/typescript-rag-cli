import { openai } from '../utils/openai';
import ora from 'ora';

/**
 * Generate text embeddings using OpenAI's API
 * @param input - Text to embed
 * @returns Promise containing vector embedding
 * @private Internal helper function
 */
function getTextEmbeddingImpl(input: string): Promise<number[]> {
  const response = openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: input
  });
  
  return response.then(res => res.data[0].embedding);
}

/**
 * Generate embeddings for text input(s) with progress indicator
 * @param input - Single text or array of text chunks to embed
 * @returns Promise containing vector embedding(s)
 */
export async function getEmbeddingsWithProgress(input: string | string[]): Promise<number[] | number[][]> {
  // Handle single string input
  if (typeof input === 'string') {
    return getTextEmbeddingImpl(input);
  }
  
  // Handle array of strings with progress indicator
  const chunks = input;
  const spinner = ora('Generating embeddings...').start();
  let completed = 0;
  
  try {
    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await getTextEmbeddingImpl(chunk);
        completed++;
        spinner.text = `Generating embeddings... ${completed}/${chunks.length}`;
        return embedding;
      })
    );
    
    spinner.succeed(`Generated ${embeddings.length} embeddings successfully`);
    return embeddings;
  } catch (error) {
    spinner.fail('Failed to generate embeddings');
    throw error;
  }
}