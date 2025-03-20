import axios from 'axios';

/**
 * Fetches Paul Graham's essay from GitHub
 * @returns Promise containing essay text
 */
export async function fetchEssay(): Promise<string> {
  const response = await axios.get('https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt');
  return response.data;
}

/**
 * Splits text into chunks of specified size
 * @param text - Text to chunk
 * @param chunkSize - Size of each chunk in characters
 * @returns Array of text chunks
 */
export function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}