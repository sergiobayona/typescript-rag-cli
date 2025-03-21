import { getEmbeddingsWithProgress } from '../services/embeddingService';
import { runCompletion } from '../services/completionService';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      }
    }
  }))
}));

// Mock ora for progress spinner
jest.mock('ora', () => {
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: ''
  };
  return jest.fn(() => mockSpinner);
});

describe('OpenAI Services', () => {
  describe('embeddingService', () => {
    it('should generate embedding for a single text input', async () => {
      const result = await getEmbeddingsWithProgress('Test text');
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should generate embeddings for multiple text chunks with progress indicator', async () => {
      const chunks = ['Chunk 1', 'Chunk 2', 'Chunk 3'];
      const results = await getEmbeddingsWithProgress(chunks);
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual([0.1, 0.2, 0.3]);
      expect(results[1]).toEqual([0.1, 0.2, 0.3]);
      expect(results[2]).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('completionService', () => {
    it('should generate chat completions', async () => {
      const result = await runCompletion('Hello');
      expect(result).toBe('Test response');
    });
  });
});
