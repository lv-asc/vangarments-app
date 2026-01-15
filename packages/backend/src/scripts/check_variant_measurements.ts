
import 'dotenv/config';
import { db } from '../database/connection';

async function checkVariantMeasurements() {
    try {
        console.log('--- Checking Variant Measurements ---');

        const parentId = 'a070965c-77c7-4b3e-b940-9f6c6f627d2b';

        // Get variants
        const variantsRes = await db.query('SELECT id, name, code FROM sku_items WHERE parent_sku_id = $1', [parentId]);
        const variants = variantsRes.rows;

        console.log(`Found ${variants.length} variants for parent ${parentId}`);

        for (const variant of variants) {
            const countRes = await db.query('SELECT count(*) FROM sku_measurements WHERE sku_id = $1', [variant.id]);
            const count = parseInt(countRes.rows[0].count, 10);
            console.log(`Variant ${variant.name} (${variant.code}) has ${count} measurements.`);

            if (count > 0) {
                const mRes = await db.query('SELECT * FROM sku_measurements WHERE sku_id = $1 LIMIT 1', [variant.id]);
                console.log('Sample measurement:', mRes.rows[0]);
            }
        }

    } catch (e) {
        console.error('Execution error:', e);
    } finally {
        await db.close();
    }
}

checkVariantMeasurements();
