import { Pool, PoolClient } from 'pg';

class Database {
  private pool: Pool;

  constructor() {
    const config = {
      connectionString: process.env.DATABASE_URL,
      user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
      host: process.env.DB_HOST || process.env.POSTGRES_HOST,
      database: process.env.DB_NAME || process.env.POSTGRES_DB || 'vangarments',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    console.log('🔌 Initializing database pool with config:', {
      host: config.host,
      database: config.database,
      user: config.user,
      hasPassword: !!config.password,
      hasUrl: !!config.connectionString
    });

    this.pool = new Pool(config);

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