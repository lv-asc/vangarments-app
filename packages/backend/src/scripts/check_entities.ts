
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    try {
        const { db } = await import('../database/connection');
        console.log('--- Entity Counts ---');

        // List tables
        const tablesRes = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in DB:', tablesRes.rows.map(r => r.table_name));

        // Brands/Stores etc
        const brandsRes = await db.query("SELECT id, brand_info, verification_status, partnership_tier FROM brand_accounts");
        console.log('Brand Accounts:', JSON.stringify(brandsRes.rows, null, 2));

        // Users
        const usersRes = await db.query("SELECT COUNT(*) FROM users");
        console.log('Users count:', usersRes.rows[0].count);

        // Items - check which table exists
        const hasBrandCatalogItems = tablesRes.rows.some(r => r.table_name === 'brand_catalog_items');
        if (hasBrandCatalogItems) {
            const bciRes = await db.query("SELECT COUNT(*) FROM brand_catalog_items");
            console.log('brand_catalog_items count:', bciRes.rows[0].count);
        }

        // Pages
        const hasPages = tablesRes.rows.some(r => r.table_name === 'pages');
        if (hasPages) {
            const pagesRes = await db.query("SELECT COUNT(*) FROM pages");
            console.log('Pages count:', pagesRes.rows[0].count);
        }

        // Posts
        const hasSocialPosts = tablesRes.rows.some(r => r.table_name === 'social_posts');
        if (hasSocialPosts) {
            const postsRes = await db.query("SELECT COUNT(*) FROM social_posts");
            console.log('Social Posts count:', postsRes.rows[0].count);
        }

        // Journalism
        const hasJournalism = tablesRes.rows.some(r => r.table_name === 'journalism_content');
        if (hasJournalism) {
            const journalismRes = await db.query("SELECT COUNT(*) FROM journalism_content");
            console.log('Journalism count:', journalismRes.rows[0].count);
        }


    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

main();
