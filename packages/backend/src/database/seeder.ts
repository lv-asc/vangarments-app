import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export interface SeedData {
  table: string;
  data: any[];
  truncate?: boolean;
  onConflict?: 'ignore' | 'update' | 'error';
}

export class DatabaseSeeder {
  private pool: Pool;
  private seedsPath: string;

  constructor(pool: Pool, seedsPath: string = path.join(__dirname, 'seeds')) {
    this.pool = pool;
    this.seedsPath = seedsPath;
  }

  async initialize(): Promise<void> {
    // Create seeds tracking table
    const createSeedsTable = `
      CREATE TABLE IF NOT EXISTS seed_history (
        id SERIAL PRIMARY KEY,
        seed_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        environment VARCHAR(50) NOT NULL,
        checksum VARCHAR(64) NOT NULL
      );
    `;

    await this.pool.query(createSeedsTable);
  }

  async getSeedFiles(): Promise<string[]> {
    if (!fs.existsSync(this.seedsPath)) {
      return [];
    }

    return fs.readdirSync(this.seedsPath)
      .filter(file => file.endsWith('.json') || file.endsWith('.js'))
      .sort();
  }

  async loadSeedData(filename: string): Promise<SeedData[]> {
    const filePath = path.join(this.seedsPath, filename);
    
    if (filename.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } else if (filename.endsWith('.js')) {
      delete require.cache[require.resolve(filePath)];
      const seedModule = require(filePath);
      return typeof seedModule === 'function' ? await seedModule() : seedModule;
    }

    throw new Error(`Unsupported seed file format: ${filename}`);
  }

  async hasBeenSeeded(seedName: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM seed_history WHERE seed_name = $1 AND environment = $2',
      [seedName, process.env.NODE_ENV || 'development']
    );
    return result.rows.length > 0;
  }

  async seedTable(seedData: SeedData): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Truncate table if requested
      if (seedData.truncate) {
        await client.query(`TRUNCATE TABLE ${seedData.table} RESTART IDENTITY CASCADE`);
      }

      // Insert data
      for (const row of seedData.data) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

        let query = `INSERT INTO ${seedData.table} (${columns.join(', ')}) VALUES (${placeholders})`;

        // Handle conflicts
        if (seedData.onConflict === 'ignore') {
          query += ' ON CONFLICT DO NOTHING';
        } else if (seedData.onConflict === 'update') {
          const updateClauses = columns
            .filter(col => col !== 'id') // Don't update ID
            .map(col => `${col} = EXCLUDED.${col}`)
            .join(', ');
          
          if (updateClauses) {
            query += ` ON CONFLICT (id) DO UPDATE SET ${updateClauses}`;
          }
        }

        await client.query(query, values);
      }

      await client.query('COMMIT');
      console.log(`✅ Seeded table ${seedData.table} with ${seedData.data.length} records`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to seed table ${seedData.table}: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async seedFile(filename: string): Promise<void> {
    console.log(`🌱 Seeding from file: ${filename}`);
    
    const seedDataArray = await this.loadSeedData(filename);
    
    for (const seedData of seedDataArray) {
      await this.seedTable(seedData);
    }

    // Record seed execution
    const content = fs.readFileSync(path.join(this.seedsPath, filename), 'utf8');
    const checksum = this.calculateChecksum(content);
    
    await this.pool.query(
      `INSERT INTO seed_history (seed_name, environment, checksum) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (seed_name) DO UPDATE SET 
       executed_at = CURRENT_TIMESTAMP, checksum = $3`,
      [filename, process.env.NODE_ENV || 'development', checksum]
    );
  }

  async seedAll(force: boolean = false): Promise<void> {
    console.log('🌱 Starting database seeding...');
    
    await this.initialize();
    
    const seedFiles = await this.getSeedFiles();
    
    if (seedFiles.length === 0) {
      console.log('ℹ️ No seed files found');
      return;
    }

    for (const filename of seedFiles) {
      if (!force && await this.hasBeenSeeded(filename)) {
        console.log(`⏭️ Skipping ${filename} (already seeded)`);
        continue;
      }

      await this.seedFile(filename);
    }

    console.log('🎉 Database seeding completed');
  }

  async createSampleData(): Promise<void> {
    console.log('🎭 Creating sample data for development...');

    const sampleUsers = [
      {
        cpf: '12345678901',
        email: 'admin@vangarments.com',
        password_hash: '$2b$10$example.hash.for.password123',
        profile: JSON.stringify({
          name: 'Admin User',
          role: 'admin',
          verified: true
        }),
        created_at: new Date().toISOString()
      },
      {
        cpf: '98765432109',
        email: 'influencer@vangarments.com',
        password_hash: '$2b$10$example.hash.for.password123',
        profile: JSON.stringify({
          name: 'Fashion Influencer',
          role: 'influencer',
          verified: true,
          followers: 10000
        }),
        created_at: new Date().toISOString()
      },
      {
        cpf: '11122233344',
        email: 'brand@vangarments.com',
        password_hash: '$2b$10$example.hash.for.password123',
        profile: JSON.stringify({
          name: 'Brand Owner',
          role: 'brand_owner',
          verified: true,
          company: 'Sample Fashion Brand'
        }),
        created_at: new Date().toISOString()
      }
    ];

    await this.seedTable({
      table: 'users',
      data: sampleUsers,
      onConflict: 'ignore'
    });

    // Create sample VUFS categories
    const sampleCategories = [
      { name: 'Clothing', level: 1, parent_id: null },
      { name: 'Shoes', level: 1, parent_id: null },
      { name: 'Accessories', level: 1, parent_id: null },
      { name: 'Tops', level: 2, parent_id: 1 },
      { name: 'Bottoms', level: 2, parent_id: 1 },
      { name: 'Outerwear', level: 2, parent_id: 1 }
    ];

    await this.seedTable({
      table: 'vufs_categories',
      data: sampleCategories,
      onConflict: 'ignore'
    });

    console.log('✅ Sample data created successfully');
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}