import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (require('fs').existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

import { db } from '../database/connection';


async function main() {
    try {
        console.log('Adding official_item_link column to sku_items table...');
        await db.query('ALTER TABLE sku_items ADD COLUMN IF NOT EXISTS official_item_link TEXT');
        console.log('✅ Column added successfully or already exists');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to add column:', error);
        process.exit(1);
    }
}

main();
