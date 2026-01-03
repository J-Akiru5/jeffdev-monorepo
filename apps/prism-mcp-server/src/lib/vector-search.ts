/**
 * Vector Search Utilities
 * 
 * Semantic search using cosine similarity for video transcripts
 */

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += (vecA[i] ?? 0) * (vecB[i] ?? 0);
    magnitudeA += (vecA[i] ?? 0) * (vecA[i] ?? 0);
    magnitudeB += (vecB[i] ?? 0) * (vecB[i] ?? 0);
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  
  if (magnitude === 0) return 0;
  
  return dotProduct / magnitude;
}

/**
 * Find top K most similar items using cosine similarity
 */
export function findTopKSimilar<T extends { embedding?: number[] }>(
  queryEmbedding: number[],
  items: T[],
  k: number = 5
): Array<T & { similarity: number }> {
  const itemsWithScores = items
    .filter((item) => item.embedding && item.embedding.length > 0)
    .map((item) => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);

  return itemsWithScores;
}

/**
 * Extract a snippet from text around the most relevant part
 * Uses embedding similarity to find the best matching segment
 */
export function extractRelevantSnippet(
  text: string,
  maxLength: number = 200
): string {
  // Simple snippet extraction - take first maxLength chars
  // In a more advanced implementation, we could chunk the text and
  // find the most relevant chunk using embeddings
  
  if (text.length <= maxLength) {
    return text;
  }

  // Try to break at sentence boundary
  const snippet = text.substring(0, maxLength);
  const lastPeriod = snippet.lastIndexOf('.');
  const lastSpace = snippet.lastIndexOf(' ');

  if (lastPeriod > maxLength * 0.7) {
    return snippet.substring(0, lastPeriod + 1);
  } else if (lastSpace > maxLength * 0.7) {
    return snippet.substring(0, lastSpace) + '...';
  }

  return snippet + '...';
}
