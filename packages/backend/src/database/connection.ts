import { Pool, PoolClient } from 'pg';

class Database {
  private pool: Pool;

  constructor() {
    console.log('🔌 Initializing database pool with URL:', this.maskUrl(process.env.DATABASE_URL));

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
      // process.exit(-1); // Don't crash the server on pool errors
    });
  }

  private maskUrl(url?: string): string {
    if (!url) return 'undefined';
    try {
      const parsed = new URL(url);
      parsed.password = '****';
      return parsed.toString();
    } catch {
      return 'invalid-url';
    }
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error', { text, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new Database();
export default db;