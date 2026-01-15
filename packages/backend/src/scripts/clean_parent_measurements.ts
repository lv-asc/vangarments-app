
import 'dotenv/config';
import { db } from '../database/connection';

async function cleanParentMeasurements() {
    try {
        console.log('--- Cleaning Parent SKU Measurements ---');

        const parentId = 'a070965c-77c7-4b3e-b940-9f6c6f627d2b';

        // 1. Check existing measurements
        const res = await db.query('SELECT count(*) FROM sku_measurements WHERE sku_id = $1', [parentId]);
        const count = parseInt(res.rows[0].count, 10);
        console.log(`Found ${count} measurements for Parent SKU.`);

        if (count > 0) {
            console.log('Deleting stale measurements...');
            await db.query('DELETE FROM sku_measurements WHERE sku_id = $1', [parentId]);
            console.log('Deleted.');
        } else {
            console.log('No measurements to delete.');
        }

    } catch (e) {
        console.error('Execution error:', e);
    } finally {
        await db.close();
    }
}

cleanParentMeasurements();
