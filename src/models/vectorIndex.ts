import { calculateL2Distance } from '../utils/distance';

export class VectorIndex {
  private vectors: number[][];

  constructor(vectors: number[][]) {
    this.vectors = vectors;
  }

  /**
   * Search for the k nearest vectors using L2 distance
   * @param queryVector - The query vector to compare against
   * @param k - Number of closest vectors to return
   * @returns Array of indices for the closest vectors
   */
  public search(queryVector: number[], k: number): number[] {
    const distances: [number, number][] = this.vectors.map(
      (vector, index) => [calculateL2Distance(queryVector, vector), index]
    );
    
    // Sort by distance (ascending) and take top k
    return distances
      .sort((a, b) => a[0] - b[0])
      .slice(0, k)
      .map(pair => pair[1]);
  }

  /**
   * Get the top k most similar chunks with their similarity scores
   * @param queryVector - The query vector to compare against
   * @param k - Number of closest vectors to return
   * @returns Array of objects containing index and similarity score
   */
  public searchWithScores(queryVector: number[], k: number): { index: number; score: number }[] {
    const distances: [number, number][] = this.vectors.map(
      (vector, index) => [calculateL2Distance(queryVector, vector), index]
    );
    
    // Sort by distance (ascending) and take top k
    return distances
      .sort((a, b) => a[0] - b[0])
      .slice(0, k)
      .map(pair => {
        // Convert distance to similarity score (1 / (1 + distance))
        const similarityScore = 1 / (1 + pair[0]);
        return { index: pair[1], score: similarityScore };
      });
  }
  
  /**
   * Get all vectors stored in the index
   * @returns Array of vectors
   */
  public getVectors(): number[][] {
    return [...this.vectors];
  }
}