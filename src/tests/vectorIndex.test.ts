import { VectorIndex } from '../models/vectorIndex';

describe('VectorIndex', () => {
  const testVectors = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12]
  ];
  
  let vectorIndex: VectorIndex;
  
  beforeEach(() => {
    vectorIndex = new VectorIndex(testVectors);
  });
  
  describe('search', () => {
    it('should return the correct indices for nearest vectors', () => {
      const queryVector = [2, 3, 4];
      const results = vectorIndex.search(queryVector, 2);
      
      // The closest vectors should be [1, 2, 3] and [4, 5, 6]
      expect(results).toHaveLength(2);
      expect(results).toContain(0);
      expect(results).toContain(1);
    });
    
    it('should return all indices when k is larger than available vectors', () => {
      const queryVector = [2, 3, 4];
      const results = vectorIndex.search(queryVector, 10);
      
      expect(results).toHaveLength(4);
    });
  });
  
  describe('searchWithScores', () => {
    it('should return indices with similarity scores', () => {
      const queryVector = [2, 3, 4];
      const results = vectorIndex.searchWithScores(queryVector, 2);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('index');
      expect(results[0]).toHaveProperty('score');
      expect(results[1]).toHaveProperty('index');
      expect(results[1]).toHaveProperty('score');
      
      // First result should have higher similarity score than second
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });
  });
  
  describe('getVectors', () => {
    it('should return a copy of all vectors', () => {
      const vectors = vectorIndex.getVectors();
      
      expect(vectors).toEqual(testVectors);
      expect(vectors).not.toBe(testVectors); // Should be a copy, not the same reference
    });
  });
});
