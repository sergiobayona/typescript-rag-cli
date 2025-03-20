import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Fetches Paul Graham's essay from GitHub
 * @returns Promise containing essay text
 */
export async function fetchEssay(): Promise<string> {
  const response = await axios.get('https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt');
  return response.data;
}

/**
 * Fetches text from a URL
 * @param url - URL to fetch text from
 * @returns Promise containing text data
 */
export async function fetchFromUrl(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch from URL: ${error}`);
  }
}

/**
 * Reads text from a local file
 * @param filePath - Path to the file
 * @returns Promise containing file contents
 */
export async function readFromFile(filePath: string): Promise<string> {
  try {
    const absolutePath = path.resolve(filePath);
    return fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read from file: ${error}`);
  }
}

/**
 * Splits text into chunks of specified size
 * @param text - Text to chunk
 * @param chunkSize - Size of each chunk in characters
 * @returns Array of text chunks
 */
export function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  
  // Smart chunking - try to break at paragraphs when possible
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start a new one
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    
    // If paragraph itself is bigger than chunk size, split it
    if (paragraph.length > chunkSize) {
      const sentenceSplits = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      
      for (const sentence of sentenceSplits) {
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        
        if (sentence.length > chunkSize) {
          // If even a sentence is too long, split at word boundaries
          const words = sentence.split(/\s+/);
          for (const word of words) {
            if (currentChunk.length + word.length + 1 > chunkSize && currentChunk.length > 0) {
              chunks.push(currentChunk);
              currentChunk = '';
            }
            
            currentChunk += (currentChunk ? ' ' : '') + word;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}