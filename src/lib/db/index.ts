import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy initialization to avoid build-time errors
let sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please add it to your .env.local file.'
    );
  }

  if (!_db) {
    sql = neon(process.env.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }

  return _db;
}

// Export a proxy that lazily initializes the db
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof typeof realDb];
    if (typeof value === 'function') {
      return value.bind(realDb);
    }
    return value;
  },
});
