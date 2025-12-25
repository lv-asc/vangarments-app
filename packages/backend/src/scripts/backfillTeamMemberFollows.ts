/**
 * Backfill script to make existing team members follow their entities
 * This creates entity_follow relationships for all existing brand_team_members
 */

import 'dotenv/config';
import { db } from '../database/connection';

async function backfillTeamMemberFollows() {
    console.log('Starting team member entity follow backfill...');

    // Get all team members with their brand's business type
    const query = `
        SELECT 
            btm.user_id,
            btm.brand_id,
            COALESCE(ba.brand_info->>'businessType', 'brand') as business_type
        FROM brand_team_members btm
        JOIN brand_accounts ba ON btm.brand_id = ba.id
        WHERE ba.deleted_at IS NULL
    `;

    const result = await db.query(query);
    console.log(`Found ${result.rows.length} team member relationships to process`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of result.rows) {
        const { user_id, brand_id, business_type } = row;

        // Determine entity type
        const entityType = business_type === 'store' ? 'store' :
            business_type === 'supplier' ? 'supplier' : 'brand';

        try {
            // Check if follow relationship already exists
            const checkQuery = `
                SELECT id FROM entity_follows 
                WHERE follower_id = $1 AND entity_type = $2 AND entity_id = $3
            `;
            const existing = await db.query(checkQuery, [user_id, entityType, brand_id]);

            if (existing.rows.length === 0) {
                // Create the follow relationship
                const insertQuery = `
                    INSERT INTO entity_follows (follower_id, entity_type, entity_id)
                    VALUES ($1, $2, $3)
                `;
                await db.query(insertQuery, [user_id, entityType, brand_id]);
                created++;
                console.log(`✓ Created follow: User ${user_id} -> ${entityType} ${brand_id}`);
            } else {
                skipped++;
            }
        } catch (error: any) {
            errors++;
            console.error(`✗ Error for user ${user_id} -> ${brand_id}:`, error.message);
        }
    }

    console.log('\n--- Backfill Complete ---');
    console.log(`Created: ${created}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors}`);

    process.exit(0);
}

backfillTeamMemberFollows().catch(e => {
    console.error('Backfill failed:', e);
    process.exit(1);
});
