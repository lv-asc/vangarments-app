
import 'dotenv/config';
import { db } from '../database/connection';

async function checkMeasurementData() {
    try {
        console.log('--- Checking Measurement Data Structure ---');

        // Get a sample measurement to see its structure
        const res = await db.query(`
            SELECT sm.*, vs.sort_order as size_sort_order, vs.name as vufs_size_name
            FROM sku_measurements sm
            JOIN vufs_sizes vs ON sm.size_id = vs.id
            LIMIT 5
        `);

        console.log('Sample measurements with size sort order:');
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error('Execution error:', e);
    } finally {
        await db.close();
    }
}

checkMeasurementData();
