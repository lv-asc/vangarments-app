
import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

async function backfill() {
    console.log('Starting slug backfill...');

    // 1. Journalism
    console.log('Backfilling Journalism...');
    const journalismRows = await db.query('SELECT id, title FROM journalism WHERE slug IS NULL');
    for (const row of journalismRows.rows) {
        const slug = slugify(row.title);
        // Handle dupes? For now simple slugify. If unique constraint fails, we might need logic.
        // Assuming unique constraint exists, we might catch error and append hash.
        await updateSlug('journalism', row.id, slug);
    }

    // 2. Pages
    console.log('Backfilling Pages...');
    const pageRows = await db.query('SELECT id, name FROM pages WHERE slug IS NULL');
    for (const row of pageRows.rows) {
        const slug = slugify(row.name);
        await updateSlug('pages', row.id, slug);
    }

    // 3. Social Posts
    console.log('Backfilling Social Posts...');
    const postRows = await db.query('SELECT id, post_type, content FROM social_posts WHERE slug IS NULL');
    for (const row of postRows.rows) {
        const content = row.content; // text or json? usually json object from pg driver
        let slug = '';
        const title = content?.title;

        if (title) {
            slug = slugify(title);
            // Append short hash to ensure uniqueness as titles might be common
            const shortHash = Math.random().toString(36).substring(2, 7);
            slug = `${slug}-${shortHash}`;
        } else {
            // Fallback if no title
            const shortHash = Math.random().toString(36).substring(2, 9);
            slug = `${row.post_type}-${shortHash}`;
        }
        await updateSlug('social_posts', row.id, slug);
    }

    console.log('Backfill complete.');
    process.exit(0);
}

async function updateSlug(table: string, id: string, slug: string) {
    try {
        await db.query(`UPDATE ${table} SET slug = $1 WHERE id = $2`, [slug, id]);
        console.log(`Updated ${table} ${id} -> ${slug}`);
    } catch (e: any) {
        if (e.code === '23505') { // unique violation
            // Try appending hash
            const newSlug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
            console.log(`Duplicate slug ${slug} for ${table} ${id}, trying ${newSlug}`);
            await updateSlug(table, id, newSlug);
        } else {
            console.error(`Failed to update ${table} ${id}:`, e);
        }
    }
}

backfill().catch(e => {
    console.error(e);
    process.exit(1);
});
