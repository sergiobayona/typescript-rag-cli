import { VectorIndex } from './vectorIndex';
import * as fs from 'fs';
import * as path from 'path';

interface Document {
  name: string;
  text: string;
  chunks: string[];
  vectorIndex: VectorIndex;
}

export class DocumentStore {
  private documents: Map<string, Document>;
  private storageDir: string;

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
   */
  public addDocument(name: string, text: string, chunks: string[], vectorIndex: VectorIndex): void {
    const document: Document = { name, text, chunks, vectorIndex };
    this.documents.set(name, document);
    
    // Save the document data
    this.saveDocument(document);
  }

  /**
   * Get a document by name
   */
  public getDocument(name: string): Document | undefined {
    return this.documents.get(name);
  }

  /**
   * List all available documents
   */
  public listDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Remove a document from the store
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
   */
  private saveVectorIndex(vectorIndex: VectorIndex, filePath: string): void {
    // Get vectors from the index (assuming we add a getter)
    const vectors = vectorIndex.getVectors();
    fs.writeFileSync(filePath, JSON.stringify(vectors, null, 2));
  }

  /**
   * Load documents from disk
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
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
}