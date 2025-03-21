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
 * Generate embeddings for text input(s) with a visual progress indicator
 * 
 * This function handles both single text inputs and arrays of text chunks:
 * - For a single string: Returns a single vector embedding
 * - For an array of strings: Processes in batches with progress indicator
 * 
 * @param input - Single text string or array of text chunks to embed
 * @returns Promise containing vector embedding(s) from OpenAI
 * @example
 * // Single text embedding
 * const embedding = await getEmbeddingsWithProgress("What is RAG?");
 * 
 * // Multiple text embeddings with progress indicator
 * const chunks = ["First chunk", "Second chunk", "Third chunk"];
 * const embeddings = await getEmbeddingsWithProgress(chunks);
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
    // Process chunks in batches to allow the spinner to update visually
    const batchSize = 5; // Process 5 chunks at a time
    const embeddings: number[][] = [];
    
    // Process chunks in sequential batches
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Process this batch in parallel
      const batchResults = await Promise.all(
        batch.map(chunk => getTextEmbeddingImpl(chunk))
      );
      
      // Update progress after each batch
      completed += batch.length;
      spinner.text = `Generating embeddings... ${completed}/${chunks.length}`;
      
      // Add results to our embeddings array
      embeddings.push(...batchResults);
    }
    
    spinner.succeed(`Generated ${embeddings.length} embeddings successfully`);
    return embeddings;
  } catch (error) {
    spinner.fail('Failed to generate embeddings');
    throw error;
  }
}