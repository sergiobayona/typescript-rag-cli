import { DocumentStore } from './models/documentStore';
import { VectorIndex } from './models/vectorIndex';
import { getTextEmbedding } from './services/embeddingService';
import { runCompletion } from './services/completionService';
import { fetchEssay, chunkText, fetchFromUrl, readFromFile } from './services/dataService';
import { program } from './cli';

// Export public API
export {
  DocumentStore,
  VectorIndex,
  getTextEmbedding,
  runCompletion,
  fetchEssay,
  fetchFromUrl,
  readFromFile,
  chunkText,
  program
};
