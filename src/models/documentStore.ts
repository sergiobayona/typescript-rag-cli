import { VectorIndex } from './vectorIndex';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface representing a document with its chunks and vector index
 */
interface Document {
  name: string;
  text: string;
  chunks: string[];
  vectorIndex: VectorIndex;
}

/**
 * Manages storage, retrieval, and persistence of documents and their vector embeddings
 */
export class DocumentStore {
  private documents: Map<string, Document>;
  private storageDir: string;

  /**
   * Creates a new DocumentStore with specified storage directory
   * @param storageDir - Directory to store document data (defaults to .ts-rag-data)
   */
  constructor(storageDir = '.ts-rag-data') {
    this.documents = new Map();
    this.storageDir = storageDir;
    
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    
    // Load any existing documents from storage
    this.loadDocuments();
  }

  /**
   * Add a document to the store
   * @param name - Unique identifier for the document
   * @param text - Full text content of the document
   * @param chunks - Text split into chunks for retrieval
   * @param vectorIndex - Vector index for semantic search
   */
  public addDocument(name: string, text: string, chunks: string[], vectorIndex: VectorIndex): void {
    const document: Document = { name, text, chunks, vectorIndex };
    this.documents.set(name, document);
    
    // Save the document data
    this.saveDocument(document);
  }

  /**
   * Get a document by name
   * @param name - Name of the document to retrieve
   * @returns The document if found, undefined otherwise
   */
  public getDocument(name: string): Document | undefined {
    return this.documents.get(name);
  }

  /**
   * List all available documents
   * @returns Array of all documents in the store
   */
  public listDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Remove a document from the store
   * @param name - Name of the document to remove
   * @returns Boolean indicating if removal was successful
   */
  public removeDocument(name: string): boolean {
    if (!this.documents.has(name)) {
      return false;
    }
    
    // Delete document files
    const docDir = path.join(this.storageDir, this.sanitizeFileName(name));
    if (fs.existsSync(docDir)) {
      fs.rmSync(docDir, { recursive: true, force: true });
    }
    
    return this.documents.delete(name);
  }

  /**
   * Save document to disk
   * @param document - Document to save
   */
  private saveDocument(document: Document): void {
    const docDir = path.join(this.storageDir, this.sanitizeFileName(document.name));
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    
    // Save document metadata
    const metadata = {
      name: document.name,
      chunkCount: document.chunks.length,
      textLength: document.text.length,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(docDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Save document text
    fs.writeFileSync(path.join(docDir, 'content.txt'), document.text);
    
    // Save chunks
    fs.writeFileSync(
      path.join(docDir, 'chunks.json'),
      JSON.stringify(document.chunks, null, 2)
    );
    
    // Save vector index
    this.saveVectorIndex(document.vectorIndex, path.join(docDir, 'vectors.json'));
  }

  /**
   * Save vector index to file
   * @param vectorIndex - Vector index to save
   * @param filePath - Path to save the vector index
   */
  private saveVectorIndex(vectorIndex: VectorIndex, filePath: string): void {
    // Get vectors from the index (assuming we add a getter)
    const vectors = vectorIndex.getVectors();
    fs.writeFileSync(filePath, JSON.stringify(vectors, null, 2));
  }

  /**
   * Load documents from disk
   * Reads all document folders from storage directory and loads them into memory
   */
  private loadDocuments(): void {
    if (!fs.existsSync(this.storageDir)) {
      return;
    }
    
    const entries = fs.readdirSync(this.storageDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const docDir = path.join(this.storageDir, entry.name);
          
          // Load metadata
          const metadataPath = path.join(docDir, 'metadata.json');
          if (!fs.existsSync(metadataPath)) continue;
          
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          // Load content
          const contentPath = path.join(docDir, 'content.txt');
          if (!fs.existsSync(contentPath)) continue;
          const text = fs.readFileSync(contentPath, 'utf8');
          
          // Load chunks
          const chunksPath = path.join(docDir, 'chunks.json');
          if (!fs.existsSync(chunksPath)) continue;
          const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
          
          // Load vector index
          const vectorsPath = path.join(docDir, 'vectors.json');
          if (!fs.existsSync(vectorsPath)) continue;
          const vectors = JSON.parse(fs.readFileSync(vectorsPath, 'utf8'));
          const vectorIndex = new VectorIndex(vectors);
          
          // Add document to memory
          this.documents.set(metadata.name, { name: metadata.name, text, chunks, vectorIndex });
          console.log(`Loaded document: ${metadata.name}`);
        } catch (error) {
          console.error(`Error loading document ${entry.name}:`, error);
        }
      }
    }
  }

  /**
   * Sanitize a file name for disk storage
   * @param fileName - Original file name
   * @returns Sanitized file name safe for use in file system
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
}