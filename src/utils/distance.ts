/**
 * Calculate the L2 (Euclidean) distance between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns The Euclidean distance
 */
export function calculateL2Distance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }
  
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }