import * as fs from 'fs';
import { fetchEssay, chunkText } from './services/dataService';
import { getTextEmbedding } from './services/embeddingService';
import { VectorIndex } from './models/vectorIndex';
import { runCompletion } from './services/completionService';

async function main() {
  // Fetch text from URL
  const text = await fetchEssay();

  // Write text to file
  fs.writeFileSync('essay.txt', text);
  console.log(`Essay length: ${text.length} characters`);

  // Split text into chunks
  const chunkSize = 2048;
  const chunks = chunkText(text, chunkSize);
  console.log(`Created ${chunks.length} chunks`);

  // Get embeddings for text chunks
  const textEmbeddings = await Promise.all(
    chunks.map(chunk => getTextEmbedding(chunk))
  );

  // Create a simple vector index
  const vectorIndex = new VectorIndex(textEmbeddings);

  // Define question and get embedding
  const question = "What were the two main things the author worked on before college?";
  const questionEmbedding = await getTextEmbedding(question);

  // Search for relevant chunks
  const indices = vectorIndex.search(questionEmbedding, 2);
  
  // Get retrieved chunks
  const retrievedChunks = indices.map(i => chunks[i]);

  // Create prompt
  const prompt = `Context information is below.
---------------------
${retrievedChunks.join("\n---------------------\n")}

Given the context information and not prior knowledge, answer the query.
Query: ${question}
Answer:`;

  // Get completion
  const completion = await runCompletion(prompt);
  console.log(completion);
}

// Export public API
export { VectorIndex } from './models/vectorIndex';
export { getTextEmbedding } from './services/embeddingService';
export { runCompletion } from './services/completionService';
export { fetchEssay, chunkText } from './services/dataService';

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}