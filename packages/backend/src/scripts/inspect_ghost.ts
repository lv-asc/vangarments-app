
import 'dotenv/config';
import { db } from '../database/connection';

async function run() {
    try {
        const ghostId = '92d5e280-6e5a-49f4-95fa-0690ff85a960';
        console.log(`Checking Ghost Brand ID: ${ghostId}`);

        const res = await db.query('SELECT * FROM brand_accounts WHERE id = $1', [ghostId]);
        console.log('Rows found:', res.rows.length);
        if (res.rows.length > 0) {
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('Brand not found in brand_accounts.');
        }

        // Also check if it exists in stores with this ID?
        const storeRes = await db.query('SELECT * FROM stores WHERE id = $1', [ghostId]);
        console.log('In Stores:', storeRes.rows.length);

    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}
run();
