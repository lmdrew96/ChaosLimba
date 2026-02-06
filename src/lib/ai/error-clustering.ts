// src/lib/ai/error-clustering.ts
// ML-based error clustering using sentence embeddings
//
// Upgrades Error Garden from simple category matching to semantic similarity.
// Groups errors that represent the same underlying interlanguage pattern,
// even if they have different surface forms.

import type { errorLogs } from '@/lib/db/schema';

type ErrorLog = typeof errorLogs.$inferSelect;

// Use `any` for the pipeline type since @xenova/transformers is dynamically imported
type EmbeddingPipeline = any;

export type MLCluster = {
  key: string;                    // Unique cluster ID
  errorType: string;
  category: string;
  representativeContext: string;  // Most central error context
  logs: ErrorLog[];
  centroid?: number[];            // Average embedding vector
  cohesion: number;               // How tightly grouped (0-1)
};

// Singleton for the embedding model
let embeddingPipeline: EmbeddingPipeline | null = null;
let initPromise: Promise<EmbeddingPipeline> | null = null;

/**
 * Get or initialize the embedding pipeline.
 * Uses all-MiniLM-L6-v2 for fast, quality sentence embeddings.
 * Dynamically imports @xenova/transformers to avoid crashing if the package is unavailable.
 */
async function getEmbeddingPipeline(): Promise<EmbeddingPipeline> {
  if (embeddingPipeline) return embeddingPipeline;

  if (!initPromise) {
    initPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true, // Smaller, faster
      });
    })();
  }

  embeddingPipeline = await initPromise;
  return embeddingPipeline;
}

/**
 * Generate embedding vector for text.
 */
async function getEmbedding(text: string): Promise<number[]> {
  const extractor = await getEmbeddingPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Batch generate embeddings for multiple texts.
 */
async function batchGetEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const extractor = await getEmbeddingPipeline();
  const embeddings: number[][] = [];

  // Process in batches of 32 to avoid memory issues
  const batchSize = 32;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const outputs = await Promise.all(
      batch.map(text => extractor(text, { pooling: 'mean', normalize: true }))
    );
    embeddings.push(...outputs.map(o => Array.from(o.data)));
  }

  return embeddings;
}

/**
 * Compute cosine similarity between two vectors.
 * Returns value between -1 and 1 (normalized vectors).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute centroid (average) of embedding vectors.
 */
function computeCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].length;
  const centroid = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += emb[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= embeddings.length;
  }

  return centroid;
}

/**
 * Find the index of the embedding closest to the centroid.
 */
function findRepresentative(embeddings: number[][], centroid: number[]): number {
  let bestIdx = 0;
  let bestSim = -1;

  for (let i = 0; i < embeddings.length; i++) {
    const sim = cosineSimilarity(embeddings[i], centroid);
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * Calculate cluster cohesion (average pairwise similarity).
 */
function calculateCohesion(embeddings: number[][]): number {
  if (embeddings.length < 2) return 1.0;

  let totalSim = 0;
  let count = 0;

  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      totalSim += cosineSimilarity(embeddings[i], embeddings[j]);
      count++;
    }
  }

  return count > 0 ? totalSim / count : 1.0;
}

/**
 * Agglomerative clustering using cosine similarity.
 * Groups items until similarity threshold is met.
 */
function agglomerativeClustering(
  embeddings: number[][],
  indices: number[],
  similarityThreshold: number = 0.65
): number[][] {
  if (indices.length <= 1) return [indices];

  // Start with each item in its own cluster
  let clusters: number[][] = indices.map(i => [i]);

  while (clusters.length > 1) {
    // Find most similar pair of clusters
    let bestI = 0;
    let bestJ = 1;
    let bestSim = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        // Average linkage: average similarity between all pairs
        let totalSim = 0;
        let count = 0;

        for (const a of clusters[i]) {
          for (const b of clusters[j]) {
            totalSim += cosineSimilarity(embeddings[a], embeddings[b]);
            count++;
          }
        }

        const avgSim = totalSim / count;
        if (avgSim > bestSim) {
          bestSim = avgSim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    // If best similarity is below threshold, stop merging
    if (bestSim < similarityThreshold) break;

    // Merge the two most similar clusters
    const merged = [...clusters[bestI], ...clusters[bestJ]];
    clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ);
    clusters.push(merged);
  }

  return clusters;
}

/**
 * ML-based error clustering using sentence embeddings.
 *
 * Strategy:
 * 1. First group by errorType (grammar, pronunciation, etc.)
 * 2. Within each type, use embeddings to find sub-clusters
 * 3. This finds patterns like "all verb conjugation errors with 'a fi'"
 *
 * Falls back to simple clustering if ML fails.
 */
export async function mlClusterErrors(
  errors: ErrorLog[],
  options: {
    similarityThreshold?: number;  // 0.0-1.0, higher = stricter clustering
    minClusterSize?: number;       // Minimum errors to form a cluster
    maxClusters?: number;          // Maximum clusters per error type
  } = {}
): Promise<MLCluster[]> {
  const {
    similarityThreshold = 0.65,
    minClusterSize = 1,
    maxClusters = 10,
  } = options;

  if (errors.length === 0) return [];

  const clusters: MLCluster[] = [];

  try {
    // Group by errorType first
    const byType: Record<string, ErrorLog[]> = {};
    for (const error of errors) {
      const type = error.errorType;
      if (!byType[type]) byType[type] = [];
      byType[type].push(error);
    }

    // Process each error type
    for (const [errorType, typeLogs] of Object.entries(byType)) {
      // Get contexts for embedding (use correction as fallback for better signal)
      const contexts = typeLogs.map(log =>
        `${log.context || ''} ${log.correction || ''}`.trim() || log.category || 'unknown'
      );

      // Generate embeddings
      const embeddings = await batchGetEmbeddings(contexts);

      if (embeddings.length !== typeLogs.length) {
        // Fallback to simple clustering
        console.warn(`[ML Clustering] Embedding mismatch for ${errorType}, falling back`);
        const simpleClusters = simpleClusterByCategory(typeLogs, errorType);
        clusters.push(...simpleClusters);
        continue;
      }

      // Cluster using agglomerative clustering
      const indices = typeLogs.map((_, i) => i);
      const clusterIndices = agglomerativeClustering(embeddings, indices, similarityThreshold);

      // Convert to MLCluster objects
      for (let i = 0; i < clusterIndices.length && clusters.length < maxClusters * Object.keys(byType).length; i++) {
        const idxs = clusterIndices[i];
        if (idxs.length < minClusterSize) continue;

        const clusterLogs = idxs.map(idx => typeLogs[idx]);
        const clusterEmbeddings = idxs.map(idx => embeddings[idx]);

        // Find the most common category in this cluster
        const categoryCounts: Record<string, number> = {};
        for (const log of clusterLogs) {
          const cat = log.category || 'general';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
        const dominantCategory = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])[0][0];

        const centroid = computeCentroid(clusterEmbeddings);
        const representativeIdx = findRepresentative(clusterEmbeddings, centroid);
        const cohesion = calculateCohesion(clusterEmbeddings);

        clusters.push({
          key: `${errorType}|${dominantCategory}|cluster${i}`,
          errorType,
          category: dominantCategory,
          representativeContext: clusterLogs[representativeIdx].context ||
                                 clusterLogs[representativeIdx].correction ||
                                 'Unknown context',
          logs: clusterLogs,
          centroid,
          cohesion,
        });
      }
    }

    // Sort clusters by size (largest first)
    clusters.sort((a, b) => b.logs.length - a.logs.length);

    console.log(`[ML Clustering] Created ${clusters.length} clusters from ${errors.length} errors`);
    return clusters;

  } catch (error) {
    console.error('[ML Clustering] Failed, falling back to simple clustering:', error);
    return simpleClusterErrors(errors);
  }
}

/**
 * Simple category-based clustering (fallback).
 */
function simpleClusterByCategory(logs: ErrorLog[], errorType: string): MLCluster[] {
  const byCategory: Record<string, ErrorLog[]> = {};

  for (const log of logs) {
    const cat = log.category || 'general';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(log);
  }

  return Object.entries(byCategory).map(([category, catLogs]) => ({
    key: `${errorType}|${category}`,
    errorType,
    category,
    representativeContext: catLogs[0].context || catLogs[0].correction || 'Unknown',
    logs: catLogs,
    cohesion: 0.5, // Unknown cohesion for simple clusters
  }));
}

/**
 * Simple fallback clustering by errorType + category.
 */
function simpleClusterErrors(errors: ErrorLog[]): MLCluster[] {
  const clusters: Record<string, ErrorLog[]> = {};

  for (const error of errors) {
    const key = `${error.errorType}|${error.category || 'general'}`;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(error);
  }

  return Object.entries(clusters).map(([key, logs]) => {
    const [errorType, category] = key.split('|');
    return {
      key,
      errorType,
      category,
      representativeContext: logs[0].context || logs[0].correction || 'Unknown',
      logs,
      cohesion: 0.5,
    };
  });
}

/**
 * Check if ML clustering is available (model can be loaded).
 */
export async function isMLClusteringAvailable(): Promise<boolean> {
  try {
    await getEmbeddingPipeline();
    return true;
  } catch {
    return false;
  }
}

/**
 * Preload the embedding model (call during app startup).
 */
export async function preloadEmbeddingModel(): Promise<void> {
  try {
    await getEmbeddingPipeline();
    console.log('[ML Clustering] Embedding model loaded');
  } catch (error) {
    console.warn('[ML Clustering] Failed to preload embedding model:', error);
  }
}
