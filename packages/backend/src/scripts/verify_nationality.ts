import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { VUFSItemModel } from '../models/VUFSItem';
import { db } from '../database/connection';

const ownerId = '6a0b5116-8b9c-4ea9-97c5-8cb7b484699a';

async function verify() {
    try {
        console.log('Testing nationality filter for Brazil...');

        // Test filtering by Brazil
        const items = await VUFSItemModel.findByOwner(ownerId, {
            nationalities: ['Brazil']
        });

        console.log(`Found ${items.length} items with nationality Brazil.`);

        const pietItems = items.filter(i => i.brand.brand.toLowerCase().includes('piet'));

        if (pietItems.length > 0) {
            console.log('SUCCESS: Found Piet items under Brazil!');
            pietItems.forEach(i => {
                console.log(`- ${i.brand.brand} (${i.vufsCode}) - Country: ${i.brandInfo?.country}`);
            });
        } else {
            console.error('FAILURE: Piet items NOT found under Brazil.');

            // Debug: Check what country Piet actually has associated in the query result
            const allItems = await VUFSItemModel.findByOwner(ownerId);
            const allPiet = allItems.filter(i => i.brand.brand.toLowerCase().includes('piet'));
            console.log('Debugging Piet items:');
            allPiet.forEach(i => {
                console.log(`- ${i.brand.brand}: brandInfo.country=${i.brandInfo?.country}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

verify();
