
import 'dotenv/config';
import { db } from '../database/connection';

async function fixBrandConfig() {
    console.log('Fixing Brand Configuration...');
    try {
        const query = "SELECT * FROM entity_configuration WHERE entity_type = 'brand'";
        const result = await db.query(query);

        if (result.rows.length === 0) {
            console.log('Brand configuration not found.');
            return;
        }

        const config = result.rows[0];
        const features = config.features || {};

        console.log('Current features:', features);

        if (features.socialLinks === true) {
            console.log('socialLinks is already enabled.');
        } else {
            console.log('Enabling socialLinks...');
            features.socialLinks = true;

            await db.query(
                "UPDATE entity_configuration SET features = $1, updated_at = NOW() WHERE entity_type = 'brand'",
                [JSON.stringify(features)]
            );
            console.log('Updated successfully.');
        }

    } catch (error) {
        console.error('Error fixing configuration:', error);
    } finally {
        await db.close();
    }
}

fixBrandConfig();
