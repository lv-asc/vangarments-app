
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

async function migrateLines() {
    console.log('Starting migration of legacy text lines...');

    try {
        // 1. Find SKUs with text line but no line_id
        // We group by brand_id and line (text) to minimize queries
        const query = `
      SELECT brand_id, line, MIN(brand_accounts.brand_info->>'name') as brand_name
      FROM sku_items
      LEFT JOIN brand_accounts ON sku_items.brand_id = brand_accounts.id
      WHERE line IS NOT NULL 
      AND line != '' 
      AND line_id IS NULL
      AND sku_items.deleted_at IS NULL
      GROUP BY brand_id, line
    `;

        const result = await db.query(query);
        const groups = result.rows;

        console.log(`Found ${groups.length} unique Brand/Line combinations to migrate.`);

        for (const group of groups) {
            const { brand_id, line, brand_name } = group;
            console.log(`Processing: Brand [${brand_name}] - Line [${line}]`);

            // 2. Check if BrandLine already exists (by name)
            const existingLineRes = await db.query(
                `SELECT id FROM brand_lines WHERE brand_id = $1 AND name = $2`,
                [brand_id, line]
            );

            let lineId: string;

            if (existingLineRes.rows.length > 0) {
                lineId = existingLineRes.rows[0].id;
                console.log(`  -> Found existing Line ID: ${lineId}`);
            } else {
                // 3. Create new BrandLine
                lineId = uuidv4();
                await db.query(
                    `INSERT INTO brand_lines (id, brand_id, name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`,
                    [lineId, brand_id, line]
                );
                console.log(`  -> Created new Line ID: ${lineId}`);
            }

            // 4. Update SKUs
            const updateRes = await db.query(
                `UPDATE sku_items 
         SET line_id = $1 
         WHERE brand_id = $2 
         AND line = $3 
         AND line_id IS NULL`,
                [lineId, brand_id, line]
            );

            console.log(`  -> Updated ${updateRes.rowCount} SKUs.`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close pool if needed, though for a script it might just hang if not closed
        // db pool usually doesn't expose close() directly in simple wrappers, 
        // but we can let process exit.
        process.exit(0);
    }
}

migrateLines();
