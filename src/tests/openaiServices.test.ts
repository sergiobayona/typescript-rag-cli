import { getTextEmbedding } from '../services/embeddingService';
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

describe('OpenAI Services', () => {
  describe('embeddingService', () => {
    it('should generate embeddings for text', async () => {
      const result = await getTextEmbedding('Test text');
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('completionService', () => {
    it('should generate chat completions', async () => {
      const result = await runCompletion('Hello');
      expect(result).toBe('Test response');
    });
  });
});
