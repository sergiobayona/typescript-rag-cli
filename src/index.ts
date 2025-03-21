import { DocumentStore } from './models/documentStore';
import { VectorIndex } from './models/vectorIndex';
import { getEmbeddingsWithProgress } from './services/embeddingService';
import { runCompletion } from './services/completionService';
import { fetchEssay, chunkText, fetchFromUrl, readFromFile } from './services/dataService';
import { isHtml, extractTextFromHtml, extractMetadata } from './utils/enhancedHtmlUtils';
import { program } from './cli';

// Export public API
export {
  DocumentStore,
  VectorIndex,
  getEmbeddingsWithProgress,
  runCompletion,
  fetchEssay,
  fetchFromUrl,
  readFromFile,
  chunkText,
  isHtml,
  extractTextFromHtml,
  extractMetadata,
  program
};