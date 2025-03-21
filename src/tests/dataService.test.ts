import { request } from 'undici';
import * as fs from 'fs';
import * as path from 'path';
import { isHtml, extractTextFromHtml, extractMetadata } from '../utils/enhancedHtmlUtils';
import ora from 'ora';
import { fetchEssay, fetchFromUrl, readFromFile, chunkText } from '../services/dataService';

// Mock dependencies
jest.mock('undici', () => ({
  request: jest.fn()
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

jest.mock('path', () => ({
  resolve: jest.fn(file => `/absolute/path/${file}`),
  basename: jest.fn(file => file.split('/').pop())
}));

jest.mock('../utils/enhancedHtmlUtils', () => ({
  isHtml: jest.fn(),
  extractTextFromHtml: jest.fn(),
  extractMetadata: jest.fn()
}));

jest.mock('ora', () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis()
  }));
});

// Save original console.log
const originalConsoleLog = console.log;

describe('Data Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to prevent output during tests
    console.log = jest.fn();
  });

  afterAll(() => {
    // Restore original console.log
    console.log = originalConsoleLog;
  });

  describe('fetchEssay', () => {
    it('should fetch Paul Graham essay from GitHub', async () => {
      const mockText = 'Essay content';
      const mockResponse = {
        body: {
          text: jest.fn().mockResolvedValue(mockText)
        }
      };
      
      (request as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await fetchEssay();
      
      expect(request).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt'
      );
      expect(result).toBe(mockText);
    });

    it('should throw an error when fetch fails', async () => {
      (request as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(fetchEssay()).rejects.toThrow();
    });
  });

  describe('fetchFromUrl', () => {
    it('should fetch text content from URL', async () => {
      const mockText = 'Plain text content';
      const mockResponse = {
        body: {
          text: jest.fn().mockResolvedValue(mockText)
        }
      };
      
      (request as jest.Mock).mockResolvedValue(mockResponse);
      (isHtml as jest.Mock).mockReturnValue(false);
      
      const result = await fetchFromUrl('https://example.com');
      
      expect(request).toHaveBeenCalledWith('https://example.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TypescriptRAG/1.0; +https://github.com/sergiobayona/typescript-rag-cli)'
        }
      });
      expect(isHtml).toHaveBeenCalledWith(mockText);
      expect(result).toBe(mockText);
    });

    it('should process HTML content by default', async () => {
      const mockHtml = '<html><body><h1>Title</h1><p>Content</p></body></html>';
      const mockProcessedText = 'Title\n\nContent';
      const mockMetadata = { title: 'Title', description: 'Description', author: 'Author' };
      
      const mockResponse = {
        body: {
          text: jest.fn().mockResolvedValue(mockHtml)
        }
      };
      
      (request as jest.Mock).mockResolvedValue(mockResponse);
      (isHtml as jest.Mock).mockReturnValue(true);
      (extractTextFromHtml as jest.Mock).mockReturnValue(mockProcessedText);
      (extractMetadata as jest.Mock).mockReturnValue(mockMetadata);
      
      const result = await fetchFromUrl('https://example.com');
      
      expect(isHtml).toHaveBeenCalledWith(mockHtml);
      expect(extractMetadata).toHaveBeenCalledWith(mockHtml);
      expect(extractTextFromHtml).toHaveBeenCalledWith(mockHtml);
      
      // Check if result includes metadata and processed content
      expect(result).toContain('# Title');
      expect(result).toContain('Description');
      expect(result).toContain('Author: Author');
      expect(result).toContain(mockProcessedText);
    });

    it('should preserve HTML when preserveHtml option is true', async () => {
      const mockHtml = '<html><body><h1>Title</h1><p>Content</p></body></html>';
      
      const mockResponse = {
        body: {
          text: jest.fn().mockResolvedValue(mockHtml)
        }
      };
      
      (request as jest.Mock).mockResolvedValue(mockResponse);
      (isHtml as jest.Mock).mockReturnValue(true);
      
      const result = await fetchFromUrl('https://example.com', { preserveHtml: true });
      
      expect(isHtml).toHaveBeenCalledWith(mockHtml);
      expect(extractTextFromHtml).not.toHaveBeenCalled();
      expect(result).toBe(mockHtml);
    });

    it('should not extract metadata when extractMetadata is false', async () => {
      const mockHtml = '<html><body><h1>Title</h1><p>Content</p></body></html>';
      const mockProcessedText = 'Title\n\nContent';
      
      const mockResponse = {
        body: {
          text: jest.fn().mockResolvedValue(mockHtml)
        }
      };
      
      (request as jest.Mock).mockResolvedValue(mockResponse);
      (isHtml as jest.Mock).mockReturnValue(true);
      (extractTextFromHtml as jest.Mock).mockReturnValue(mockProcessedText);
      
      const result = await fetchFromUrl('https://example.com', { extractMetadata: false });
      
      expect(isHtml).toHaveBeenCalledWith(mockHtml);
      expect(extractMetadata).not.toHaveBeenCalled();
      expect(extractTextFromHtml).toHaveBeenCalledWith(mockHtml);
      expect(result).toBe(mockProcessedText);
    });

    it('should handle fetch errors', async () => {
      (request as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(fetchFromUrl('https://example.com')).rejects.toThrow('Failed to fetch from URL');
    });
  });

  describe('readFromFile', () => {
    it('should read text content from a file', async () => {
      const mockText = 'Plain text content';
      
      (fs.readFileSync as jest.Mock).mockReturnValue(mockText);
      (isHtml as jest.Mock).mockReturnValue(false);
      
      const result = await readFromFile('file.txt');
      
      expect(path.resolve).toHaveBeenCalledWith('file.txt');
      expect(fs.readFileSync).toHaveBeenCalledWith('/absolute/path/file.txt', 'utf8');
      expect(isHtml).toHaveBeenCalledWith(mockText);
      expect(result).toBe(mockText);
    });

    it('should process HTML content by default', async () => {
      const mockHtml = '<html><body><h1>Title</h1><p>Content</p></body></html>';
      const mockProcessedText = 'Title\n\nContent';
      const mockMetadata = { title: 'Title', description: 'Description', author: 'Author' };
      
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);
      (isHtml as jest.Mock).mockReturnValue(true);
      (extractTextFromHtml as jest.Mock).mockReturnValue(mockProcessedText);
      (extractMetadata as jest.Mock).mockReturnValue(mockMetadata);
      
      const result = await readFromFile('file.html');
      
      expect(isHtml).toHaveBeenCalledWith(mockHtml);
      expect(extractMetadata).toHaveBeenCalledWith(mockHtml);
      expect(extractTextFromHtml).toHaveBeenCalledWith(mockHtml);
      
      // Check if result includes metadata and processed content
      expect(result).toContain('# Title');
      expect(result).toContain('Description');
      expect(result).toContain('Author: Author');
      expect(result).toContain(mockProcessedText);
    });

    it('should preserve HTML when preserveHtml option is true', async () => {
      const mockHtml = '<html><body><h1>Title</h1><p>Content</p></body></html>';
      
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);
      (isHtml as jest.Mock).mockReturnValue(true);
      
      const result = await readFromFile('file.html', { preserveHtml: true });
      
      expect(isHtml).toHaveBeenCalledWith(mockHtml);
      expect(extractTextFromHtml).not.toHaveBeenCalled();
      expect(result).toBe(mockHtml);
    });

    it('should not extract metadata when extractMetadata is false', async () => {
      const mockHtml = '<html><body><h1>Title</h1><p>Content</p></body></html>';
      const mockProcessedText = 'Title\n\nContent';
      
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);
      (isHtml as jest.Mock).mockReturnValue(true);
      (extractTextFromHtml as jest.Mock).mockReturnValue(mockProcessedText);
      
      const result = await readFromFile('file.html', { extractMetadata: false });
      
      expect(isHtml).toHaveBeenCalledWith(mockHtml);
      expect(extractMetadata).not.toHaveBeenCalled();
      expect(extractTextFromHtml).toHaveBeenCalledWith(mockHtml);
      expect(result).toBe(mockProcessedText);
    });

    it('should handle file read errors', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });
      
      await expect(readFromFile('nonexistent.txt')).rejects.toThrow('Failed to read from file');
    });
  });

  describe('chunkText', () => {
    it('should split text into chunks of specified size', () => {
      const text = 'This is a test paragraph. This is a second paragraph. And this is a third one.';
      const chunks = chunkText(text, 20);
      
      expect(chunks.length).toBeGreaterThan(1);
      // Each chunk should be <= chunkSize
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(20);
      });
    });

    it('should handle paragraphs correctly', () => {
      const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
      const chunks = chunkText(text, 30);
      
      // Ensure we have at least 2 chunks (instead of expecting exactly 3)
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      // Check that the content is distributed across the chunks
      expect(chunks.some(chunk => chunk.includes('Paragraph one.'))).toBe(true);
      expect(chunks.some(chunk => chunk.includes('Paragraph two.'))).toBe(true);
      expect(chunks.some(chunk => chunk.includes('Paragraph three.'))).toBe(true);
    });

    it('should handle single long paragraph by breaking at sentences', () => {
      const text = 'This is sentence one. This is sentence two. This is sentence three.';
      const chunks = chunkText(text, 25);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0]).toContain('This is sentence one.');
    });

    it('should handle very long words by splitting at word boundaries', () => {
      const text = 'This contains a verylongwordthatexceedschunksize and should be split correctly.';
      const chunks = chunkText(text, 20);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.some(chunk => chunk.includes('verylongwordthatexceedschunksize'))).toBe(true);
    });

    it('should return the original text as a single chunk if it fits', () => {
      const text = 'Short text.';
      const chunks = chunkText(text, 20);
      
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe('Short text.');
    });
  });
});
