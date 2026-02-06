// src/lib/ai/error-clustering.ts
// Error clustering for Error Garden
//
// Groups errors by errorType + category to identify interlanguage patterns.

import type { errorLogs } from '@/lib/db/schema';

type ErrorLog = typeof errorLogs.$inferSelect;

export type MLCluster = {
  key: string;
  errorType: string;
  category: string;
  representativeContext: string;
  logs: ErrorLog[];
  cohesion: number;
};

/**
 * Cluster errors by errorType + category.
 */
export function clusterErrors(errors: ErrorLog[]): MLCluster[] {
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
