// src/services/dataService.ts
import { request } from 'undici';
import * as fs from 'fs';
import * as path from 'path';
import { isHtml, extractTextFromHtml, extractMetadata } from '../utils/enhancedHtmlUtils';
import ora from 'ora';

/**
 * HTML processing options for document fetching and reading
 */
export interface HtmlProcessingOptions {
  /** Whether to preserve original HTML instead of extracting text */
  preserveHtml?: boolean;
  /** Whether to extract and include metadata from HTML documents */
  extractMetadata?: boolean;
}

/**
 * Fetches Paul Graham's essay from GitHub as sample content
 * 
 * This provides an easy way to test the RAG system with high-quality sample text.
 * The essay is fetched from the LlamaIndex example repository.
 * 
 * @returns Promise containing the full text of Paul Graham's essay
 * @throws Error if fetching fails
 * 
 * @example
 * const essayText = await fetchEssay();
 * console.log(`Fetched essay with ${essayText.length} characters`);
 */
export async function fetchEssay(): Promise<string> {
  const response = await request('https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt');
  return await response.body.text();
}

/**
 * Fetches and processes text content from a URL with HTML detection
 * 
 * This function:
 * 1. Fetches content from the specified URL
 * 2. Detects if the content is HTML
 * 3. If HTML, extracts readable text and metadata (unless preserveHtml is true)
 * 4. Shows progress with an ora spinner
 * 
 * @param url - URL to fetch text from
 * @param options - HTML processing options for customizing extraction behavior
 * @returns Promise containing processed text content
 * @throws Error if fetching or processing fails
 * 
 * @example
 * // Basic usage
 * const content = await fetchFromUrl('https://example.com/article');
 * 
 * // Preserve HTML instead of extracting text
 * const htmlContent = await fetchFromUrl('https://example.com', { preserveHtml: true });
 * 
 * // Disable metadata extraction
 * const textOnly = await fetchFromUrl('https://example.com/page', { extractMetadata: false });
 */
export async function fetchFromUrl(
  url: string, 
  options: HtmlProcessingOptions = {}
): Promise<string> {
  try {
    const spinner = ora('Fetching content from URL...').start();
    
    const response = await request(url, {
      headers: {
        // Set a user agent to avoid being blocked by some sites
        'User-Agent': 'Mozilla/5.0 (compatible; TypescriptRAG/1.0; +https://github.com/sergiobayona/typescript-rag-cli)'
      }
    });
    
    let content = await response.body.text();
    
    // Check if content is HTML
    if (isHtml(content) && !options.preserveHtml) {
      spinner.text = 'HTML content detected, processing...';
      
      let headerInfo = '';
      
      // Extract metadata if enabled
      if (options.extractMetadata !== false) {
        const metadata = extractMetadata(content);
        if (metadata.title) {
          spinner.text = `Processing HTML content: "${metadata.title}"`;
        }
        
        // Add metadata as header if available
        if (metadata.title) {
          headerInfo += `# ${metadata.title}\n\n`;
        }
        if (metadata.description) {
          headerInfo += `${metadata.description}\n\n`;
        }
        if (metadata.author) {
          headerInfo += `Author: ${metadata.author}\n\n`;
        }
        if (headerInfo) {
          headerInfo += `Source: ${url}\n\n---\n\n`;
        }
      }
      
      // Extract text content
      content = extractTextFromHtml(content);
      
      // Add metadata header if we have it
      if (headerInfo) {
        content = headerInfo + content;
      }
      
      spinner.succeed(`HTML processed successfully (${content.length} characters)`);
    } else if (isHtml(content) && options.preserveHtml) {
      spinner.succeed('HTML content preserved as requested');
    } else {
      spinner.succeed('Content fetched successfully (not HTML)');
    }
    
    return content;
  } catch (error) {
    throw new Error(`Failed to fetch from URL: ${error}`);
  }
}

/**
 * Reads and processes text from a local file with HTML detection
 * 
 * This function:
 * 1. Reads content from the specified file path
 * 2. Detects if the content is HTML
 * 3. If HTML, extracts readable text and metadata (unless preserveHtml is true)
 * 
 * @param filePath - Path to the local file to read
 * @param options - HTML processing options for customizing extraction behavior
 * @returns Promise containing processed file contents
 * @throws Error if file reading or processing fails
 * 
 * @example
 * // Basic usage
 * const content = await readFromFile('./document.html');
 * 
 * // Preserve HTML
 * const htmlContent = await readFromFile('./page.html', { preserveHtml: true });
 */
export async function readFromFile(
  filePath: string,
  options: HtmlProcessingOptions = {}
): Promise<string> {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    
    // Check if content is HTML and process if needed
    if (isHtml(content) && !options.preserveHtml) {
      console.log('HTML content detected in file, processing...');
      
      let processedContent = extractTextFromHtml(content);
      
      // Add metadata if enabled
      if (options.extractMetadata !== false) {
        const metadata = extractMetadata(content);
        let headerInfo = '';
        
        if (metadata.title) {
          headerInfo += `# ${metadata.title}\n\n`;
        }
        if (metadata.description) {
          headerInfo += `${metadata.description}\n\n`;
        }
        if (metadata.author) {
          headerInfo += `Author: ${metadata.author}\n\n`;
        }
        
        if (headerInfo) {
          headerInfo += `Source: ${path.basename(filePath)}\n\n---\n\n`;
          processedContent = headerInfo + processedContent;
        }
      }
      
      return processedContent;
    } else if (isHtml(content) && options.preserveHtml) {
      console.log('HTML content detected in file, preserving as requested');
    }
    
    return content;
  } catch (error) {
    throw new Error(`Failed to read from file: ${error}`);
  }
}

/**
 * Intelligently splits text into chunks of specified size
 * 
 * This function uses a smart chunking algorithm that attempts to:
 * 1. Split at paragraph boundaries when possible
 * 2. Fall back to sentence boundaries when paragraphs are too large
 * 3. Split at word boundaries as a last resort
 * 
 * The goal is to maintain semantic coherence while respecting size limits.
 * 
 * @param text - Text content to split into chunks
 * @param chunkSize - Maximum size of each chunk in characters
 * @returns Array of text chunks
 * 
 * @example
 * // Split text into chunks of 2048 characters
 * const text = "Very long document text...";
 * const chunks = chunkText(text, 2048);
 * console.log(`Split into ${chunks.length} chunks`);
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