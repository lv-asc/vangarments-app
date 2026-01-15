
import 'dotenv/config';
import { db } from '../database/connection';

async function cleanupParent() {
    try {
        console.log('--- Parent SKU Cleanup ---');

        const parentId = 'a070965c-77c7-4b3e-b940-9f6c6f627d2b';

        // 1. Fetch current parent data
        const res = await db.query('SELECT name, code, metadata FROM sku_items WHERE id = $1', [parentId]);
        if (res.rows.length === 0) {
            console.log('Parent SKU not found');
            return;
        }

        const current = res.rows[0];
        console.log('Current Name:', current.name);
        console.log('Current Code:', current.code);

        // 2. Prepare new values
        // Remove [S] from name
        const newName = current.name.replace(/\s*\[S\]\s*$/i, '').trim();
        // Remove -S from code
        const newCode = current.code.replace(/-BK-S$/i, '-BK').trim();

        // Update metadata: remove size info
        const metadata = typeof current.metadata === 'string' ? JSON.parse(current.metadata) : current.metadata || {};
        delete metadata.sizeId;
        delete metadata.sizeName;
        // Keep other relevant metadata (fit, color, model, etc.)

        console.log('\nUpdating to:');
        console.log('New Name:', newName);
        console.log('New Code:', newCode);
        console.log('New Metadata (clean):', JSON.stringify(metadata));

        // 3. Apply update
        await db.query(
            'UPDATE sku_items SET name = $1, code = $2, metadata = $3 WHERE id = $4',
            [newName, newCode, JSON.stringify(metadata), parentId]
        );

        console.log('\nUpdate successful!');

    } catch (e) {
        console.error('Execution error:', e);
    } finally {
        await db.close();
    }
}

cleanupParent();
