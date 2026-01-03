// @ts-nocheck
/**
 * Script to populate apparel attributes (subcategories, sizes, fits, package measurements)
 * Run with: npx ts-node src/scripts/seedApparelData.ts
 */

import { db } from '../database/connection';

interface ApparelConfig {
    possibleSizes: string[];
    possibleFits: string[];
    packageMeasurements: { height: number; length: number; width: number; weight: number };
}

const APPAREL_CONFIGS: Record<string, ApparelConfig> = {
    't-shirt': { possibleSizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim', 'Oversized', 'Boxy'], packageMeasurements: { height: 2, length: 30, width: 25, weight: 0.2 } },
    'polo': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim'], packageMeasurements: { height: 2, length: 32, width: 26, weight: 0.25 } },
    'shirt': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim', 'Relaxed'], packageMeasurements: { height: 2, length: 35, width: 28, weight: 0.25 } },
    'tank': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL'], possibleFits: ['Regular Fit', 'Slim', 'Loose'], packageMeasurements: { height: 1, length: 28, width: 22, weight: 0.1 } },
    'jersey': { possibleSizes: ['S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Loose'], packageMeasurements: { height: 2, length: 35, width: 30, weight: 0.3 } },
    'hoodie': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Oversized', 'Boxy'], packageMeasurements: { height: 5, length: 40, width: 35, weight: 0.5 } },
    'sweater': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim', 'Oversized'], packageMeasurements: { height: 4, length: 38, width: 32, weight: 0.4 } },
    'crewneck': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Oversized'], packageMeasurements: { height: 4, length: 38, width: 32, weight: 0.4 } },
    'turtle': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL'], possibleFits: ['Regular Fit', 'Slim'], packageMeasurements: { height: 3, length: 35, width: 30, weight: 0.35 } },
    'jacket': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim', 'Oversized'], packageMeasurements: { height: 8, length: 50, width: 40, weight: 0.8 } },
    'windbreaker': { possibleSizes: ['S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Loose'], packageMeasurements: { height: 4, length: 40, width: 35, weight: 0.3 } },
    'puffer': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Oversized'], packageMeasurements: { height: 15, length: 55, width: 45, weight: 1.0 } },
    'jeans': { possibleSizes: ['30', '32', '34', '36', '38', '40'], possibleFits: ['Slim', 'Straight', 'Skinny', 'Relaxed', 'Wide', 'Bootcut'], packageMeasurements: { height: 4, length: 40, width: 30, weight: 0.6 } },
    'pants': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38'], possibleFits: ['Slim', 'Straight', 'Regular Fit', 'Wide', 'Relaxed'], packageMeasurements: { height: 4, length: 40, width: 30, weight: 0.5 } },
    'shorts': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim', 'Relaxed'], packageMeasurements: { height: 2, length: 30, width: 25, weight: 0.25 } },
    'sweatpants': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim', 'Baggy'], packageMeasurements: { height: 3, length: 38, width: 28, weight: 0.4 } },
    'hat': { possibleSizes: ['U', 'Adjustable'], possibleFits: ['Adjustable Fit'], packageMeasurements: { height: 12, length: 20, width: 20, weight: 0.1 } },
    'cap': { possibleSizes: ['U', 'Adjustable'], possibleFits: ['Adjustable Fit'], packageMeasurements: { height: 12, length: 18, width: 18, weight: 0.08 } },
    'beanie': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 3, length: 22, width: 18, weight: 0.08 } },
    'bucket': { possibleSizes: ['S', 'M', 'L', 'U'], possibleFits: [], packageMeasurements: { height: 10, length: 25, width: 25, weight: 0.1 } },
    'bag': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 35, length: 45, width: 20, weight: 0.8 } },
    'wallet': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 2, length: 12, width: 10, weight: 0.1 } },
    'card holder': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 1, length: 10, width: 7, weight: 0.05 } },
    'belt': { possibleSizes: ['S', 'M', 'L', 'XL', '30', '32', '34', '36', '38'], possibleFits: [], packageMeasurements: { height: 3, length: 35, width: 8, weight: 0.15 } },
    'watch': { possibleSizes: ['U', '18mm'], possibleFits: [], packageMeasurements: { height: 10, length: 12, width: 10, weight: 0.15 } },
    'glasses': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 5, length: 16, width: 6, weight: 0.05 } },
    'sunglasses': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 5, length: 16, width: 6, weight: 0.05 } },
    'ring': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 2, length: 5, width: 5, weight: 0.02 } },
    'necklace': { possibleSizes: ['U'], possibleFits: [], packageMeasurements: { height: 2, length: 12, width: 12, weight: 0.05 } },
    'gloves': { possibleSizes: ['S', 'M', 'L', 'XL'], possibleFits: [], packageMeasurements: { height: 3, length: 25, width: 12, weight: 0.1 } },
    'jumpsuit': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL'], possibleFits: ['Regular Fit', 'Relaxed'], packageMeasurements: { height: 5, length: 50, width: 35, weight: 0.6 } },
    'overalls': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Relaxed', 'Baggy'], packageMeasurements: { height: 5, length: 50, width: 35, weight: 0.7 } },
    'tracksuit': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim', 'Loose'], packageMeasurements: { height: 6, length: 45, width: 35, weight: 0.8 } },
    'vest': { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit', 'Slim'], packageMeasurements: { height: 3, length: 35, width: 30, weight: 0.25 } },
};

function getConfigForApparel(name: string): ApparelConfig {
    const lowerName = name.toLowerCase();
    for (const [pattern, config] of Object.entries(APPAREL_CONFIGS)) {
        if (lowerName.includes(pattern)) return config;
    }
    return { possibleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], possibleFits: ['Regular Fit'], packageMeasurements: { height: 5, length: 35, width: 30, weight: 0.4 } };
}

async function seedApparelData() {
    const client = await db.getClient();
    try {
        console.log('Starting apparel data seeding...');

        const sizesResult = await client.query(`SELECT id, name FROM vufs_sizes WHERE is_deleted = false`);
        const fitsResult = await client.query(`SELECT id, name FROM vufs_fits WHERE is_deleted = false`);
        const sizeMap = new Map(sizesResult.rows.map((r: any) => [r.name, r.id]));
        const fitMap = new Map(fitsResult.rows.map((r: any) => [r.name, r.id]));

        const apparelResult = await client.query(`SELECT id, name, parent_id FROM vufs_attribute_values WHERE type_slug = 'apparel'`);
        const sub3Result = await client.query(`SELECT id, name, parent_id FROM vufs_attribute_values WHERE type_slug = 'subcategory-3'`);
        const sub2Result = await client.query(`SELECT id, name, parent_id FROM vufs_attribute_values WHERE type_slug = 'subcategory-2'`);
        const sub1Result = await client.query(`SELECT id, name FROM vufs_attribute_values WHERE type_slug = 'subcategory-1'`);

        const sub3Map = new Map(sub3Result.rows.map((r: any) => [r.id, { name: r.name, parentId: r.parent_id }]));
        const sub2Map = new Map(sub2Result.rows.map((r: any) => [r.id, { name: r.name, parentId: r.parent_id }]));
        const sub1Map = new Map(sub1Result.rows.map((r: any) => [r.id, r.name]));

        for (const apparel of apparelResult.rows) {
            console.log(`Processing: ${apparel.name}`);
            const config = getConfigForApparel(apparel.name);

            // Resolve hierarchy - parent can be subcategory-2 or subcategory-3
            let sub1Id = '';
            let sub2Id = '';
            let sub3Id = '';

            const parentId = apparel.parent_id;
            if (sub3Map.has(parentId)) {
                // Parent is subcategory-3
                sub3Id = parentId;
                const sub3 = sub3Map.get(parentId)!;
                const sub2 = sub2Map.get(sub3.parentId);
                if (sub2) {
                    sub2Id = sub3.parentId;
                    sub1Id = sub2.parentId || '';
                }
            } else if (sub2Map.has(parentId)) {
                // Parent is subcategory-2 (no subcategory-3)
                sub2Id = parentId;
                const sub2 = sub2Map.get(parentId)!;
                sub1Id = sub2.parentId || '';
            } else if (sub1Map.has(parentId)) {
                // Parent is subcategory-1 (no sub2 or sub3)
                sub1Id = parentId;
            }

            const sizeIds = config.possibleSizes.map((s: string) => sizeMap.get(s)).filter(Boolean);
            const fitIds = config.possibleFits.map((f: string) => fitMap.get(f)).filter(Boolean);

            const attrs = [
                { slug: 'subcategory-1', value: sub1Id },
                { slug: 'subcategory-2', value: sub2Id },
                { slug: 'subcategory-3', value: sub3Id },
                { slug: 'height-cm', value: String(config.packageMeasurements.height) },
                { slug: 'length-cm', value: String(config.packageMeasurements.length) },
                { slug: 'width-cm', value: String(config.packageMeasurements.width) },
                { slug: 'weight-kg', value: String(config.packageMeasurements.weight) },
                { slug: 'possible-sizes', value: JSON.stringify(sizeIds) },
                { slug: 'possible-fits', value: JSON.stringify(fitIds) },
            ];

            for (const attr of attrs) {
                await client.query(`
          INSERT INTO vufs_category_attributes (category_id, attribute_slug, value, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (category_id, attribute_slug) 
          DO UPDATE SET value = $3, updated_at = NOW()
        `, [String(apparel.id), attr.slug, attr.value]);
            }
        }

        console.log('Seeding complete!');
    } finally {
        client.release();
    }
}

seedApparelData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
