import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

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
      throw new Error(`Failed to seed table ${seedData.table}: ${(error as Error).message}`);
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

  async seedStructuralData(): Promise<void> {
    console.log('🏗️ Seeding structural data...');

    // Create standard VUFS categories
    const standardCategories = [
      { name: 'Clothing', level: 1, parent_id: null },
      { name: 'Shoes', level: 1, parent_id: null },
      { name: 'Accessories', level: 1, parent_id: null },
      { name: 'Tops', level: 2, parent_id: 1 },
      { name: 'Bottoms', level: 2, parent_id: 1 },
      { name: 'Outerwear', level: 2, parent_id: 1 },
      { name: 'Dresses', level: 2, parent_id: 1 }
    ];

    await this.seedTable({
      table: 'vufs_categories',
      data: standardCategories,
      onConflict: 'ignore'
    });

    console.log('✅ Structural data seeded successfully');
  }

  async createSampleWardrobe(): Promise<void> {
    console.log('👗 Creating sample wardrobe items...');

    // Get Admin User ID
    const userResult = await this.pool.query("SELECT id FROM users WHERE email = 'admin@vangarments.com'");
    if (userResult.rows.length === 0) {
      console.warn('⚠️ Admin user not found. Skipping wardrobe seeding.');
      return;
    }
    const userId = userResult.rows[0].id;

    const sampleItems = [
      {
        vufs_code: `VG-SAMPLE-${Date.now()}-001`,
        owner_id: userId,
        category_hierarchy: JSON.stringify({
          page: 'TOPS',
          category: 'Shirts',
          blueSubcategory: 'Casual Shirts',
          whiteSubcategory: 'Denim Shirt',
          graySubcategory: 'Vintage Wash'
        }),
        brand_hierarchy: JSON.stringify({
          brand: 'Levi\'s',
          line: 'Premium',
          collection: 'Vintage'
        }),
        metadata: JSON.stringify({
          name: 'Vintage Denim Shirt',
          composition: [{ name: 'Cotton', percentage: 100 }],
          colors: [{ name: 'Blue', hex: '#1E3A8A' }],
          careInstructions: ['Machine Wash Cold'],
          size: 'M'
        }),
        condition_info: JSON.stringify({
          status: 'good',
          description: 'Well kept vintage condition'
        }),
        ownership_info: JSON.stringify({
          status: 'owned',
          visibility: 'public'
        }),
        search_keywords: ['denim', 'shirt', 'vintage', 'levis', 'blue']
      },
      {
        vufs_code: `VG-SAMPLE-${Date.now()}-002`,
        owner_id: userId,
        category_hierarchy: JSON.stringify({
          page: 'OUTERWEAR',
          category: 'Jackets',
          blueSubcategory: 'Leather Jackets',
          whiteSubcategory: 'Biker Jacket',
          graySubcategory: 'Classic Biker'
        }),
        brand_hierarchy: JSON.stringify({
          brand: 'AllSaints',
          line: 'Mainline',
          collection: 'Core'
        }),
        metadata: JSON.stringify({
          name: 'Classic Leather Biker Jacket',
          composition: [{ name: 'Leather', percentage: 100 }],
          colors: [{ name: 'Black', hex: '#000000' }],
          careInstructions: ['Specialist Leather Clean'],
          size: 'L'
        }),
        condition_info: JSON.stringify({
          status: 'excellent',
          description: 'Like new, barely worn'
        }),
        ownership_info: JSON.stringify({
          status: 'owned',
          visibility: 'public'
        }),
        search_keywords: ['leather', 'jacket', 'biker', 'allsaints', 'black']
      },
      {
        vufs_code: `VG-SAMPLE-${Date.now()}-003`,
        owner_id: userId,
        category_hierarchy: JSON.stringify({
          page: 'DRESSES',
          category: 'Evening',
          blueSubcategory: 'Cocktail Dresses',
          whiteSubcategory: 'Silk Dress',
          graySubcategory: 'Slip Dress'
        }),
        brand_hierarchy: JSON.stringify({
          brand: 'Reformation',
          line: 'Sustainable',
          collection: 'Summer'
        }),
        metadata: JSON.stringify({
          name: 'Silk Slip Dress',
          composition: [{ name: 'Silk', percentage: 100 }],
          colors: [{ name: 'Emerald', hex: '#047857' }],
          careInstructions: ['Dry Clean Only'],
          size: 'S'
        }),
        condition_info: JSON.stringify({
          status: 'new',
          description: 'Brand new with tags'
        }),
        ownership_info: JSON.stringify({
          status: 'owned',
          visibility: 'public'
        }),
        search_keywords: ['silk', 'dress', 'slip', 'green', 'emerald', 'reformation']
      },
      {
        vufs_code: `VG-SAMPLE-${Date.now()}-004`,
        owner_id: userId,
        category_hierarchy: JSON.stringify({
          page: 'SHOES',
          category: 'Sneakers',
          blueSubcategory: 'Lifestyle',
          whiteSubcategory: 'Low Top',
          graySubcategory: 'Canvas'
        }),
        brand_hierarchy: JSON.stringify({
          brand: 'Converse',
          line: 'Chuck Taylor',
          collection: 'All Star'
        }),
        metadata: JSON.stringify({
          name: 'Chuck Taylor All Star High Top',
          composition: [{ name: 'Canvas', percentage: 100 }, { name: 'Rubber', percentage: 100 }],
          colors: [{ name: 'White', hex: '#FFFFFF' }],
          careInstructions: ['Hand Wash'],
          size: '42'
        }),
        condition_info: JSON.stringify({
          status: 'fair',
          description: 'Well loved, some scuffs'
        }),
        ownership_info: JSON.stringify({
          status: 'owned',
          visibility: 'public'
        }),
        search_keywords: ['sneakers', 'converse', 'white', 'canvas', 'chuck taylor']
      }
    ];

    await this.seedTable({
      table: 'vufs_items',
      data: sampleItems,
      onConflict: 'ignore'
    });

    // Seed Images
    const itemCodes = sampleItems.map(i => i.vufs_code);
    const sql = `SELECT id, vufs_code FROM vufs_items WHERE vufs_code = ANY($1)`;
    const insertedItemsResult = await this.pool.query(sql, [itemCodes]);

    // Map of code -> image url
    const imageUrls: Record<string, string> = {
      [sampleItems[0].vufs_code]: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80', // Denim Shirt
      [sampleItems[1].vufs_code]: 'https://images.unsplash.com/photo-1551028919-ac7fa5cf60f6?w=500&q=80', // Leather Jacket
      [sampleItems[2].vufs_code]: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80', // Silk Dress
      [sampleItems[3].vufs_code]: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=500&q=80', // Converse
    };

    const imageRows = insertedItemsResult.rows.map(item => ({
      item_id: item.id,
      image_url: imageUrls[item.vufs_code],
      image_type: 'front',
      processing_status: 'completed',
      is_processed: true,
      is_primary: true
    }));

    if (imageRows.length > 0) {
      await this.seedTable({
        table: 'item_images',
        data: imageRows,
        onConflict: 'ignore'
      });
      console.log(`✅ Seeded images for ${imageRows.length} items`);
    }

    console.log(`✅ Seeded ${sampleItems.length} wardrobe items`);
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}