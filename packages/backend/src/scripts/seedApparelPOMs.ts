// @ts-nocheck
/**
 * Script to populate POM mappings for all apparel types
 * Run with: DATABASE_URL="postgresql://lv@localhost:5432/vangarments" npx ts-node --transpile-only src/scripts/seedApparelPOMs.ts
 */

import { db } from '../database/connection';

// POM codes by category
const TOP_POMS = ['HPS', 'CH', 'SH', 'SW', 'AH', 'SL', 'CB', 'CO', 'FD', 'BD', 'NW']; // Body Length (HPS), Chest, Shoulder, etc.
const BOTTOM_POMS = ['WB', 'HP', 'FR', 'BR', 'IN', 'OS', 'TH', 'KN', 'LO']; // Waistband, Hip, Inseam, etc.
const ONEPIECE_POMS = ['TL', 'BH', 'BW', 'TR']; // Total Length, Bib Height, etc.
const BAG_POMS = ['WI', 'HT', 'DP', 'SD']; // Width, Height, Depth, Strap Drop
const BELT_POMS = ['BL']; // Belt Length
const HAT_POMS = ['HC']; // Head Circumference

// Map apparel patterns to their POM codes
const APPAREL_POM_MAP: Record<string, string[]> = {
    // Tops - need body/chest/shoulder/sleeve measurements
    't-shirt': TOP_POMS,
    'polo': TOP_POMS,
    'shirt': TOP_POMS,
    'baby tee': TOP_POMS,
    'tank': ['HPS', 'CH', 'SH', 'SW', 'AH', 'FD'], // No sleeves
    'jersey': TOP_POMS,
    'hoodie': TOP_POMS,
    'sweater': TOP_POMS,
    'crewneck': TOP_POMS,
    'turtle': TOP_POMS,
    'vest': ['HPS', 'CH', 'SH', 'SW', 'AH'], // No sleeves
    // Outerwear
    'jacket': TOP_POMS,
    'windbreaker': TOP_POMS,
    'puffer': TOP_POMS,
    'bomber': TOP_POMS,
    'varsity': TOP_POMS,
    'leather': TOP_POMS,
    // Bottoms
    'jeans': BOTTOM_POMS,
    'pants': BOTTOM_POMS,
    'shorts': ['WB', 'HP', 'FR', 'BR', 'OS', 'TH', 'LO'], // No knee/inseam for shorts
    'sweatpants': BOTTOM_POMS,
    'cargo': BOTTOM_POMS,
    'tailored': BOTTOM_POMS,
    'jorts': ['WB', 'HP', 'FR', 'BR', 'OS', 'TH', 'LO'],
    'sweatshorts': ['WB', 'HP', 'FR', 'BR', 'OS', 'TH', 'LO'],
    // One-pieces
    'jumpsuit': [...ONEPIECE_POMS, ...BOTTOM_POMS.slice(0, 6)],
    'overalls': [...ONEPIECE_POMS, ...BOTTOM_POMS],
    'tracksuit': TOP_POMS, // Tracksuit top uses top POMs
    'dress': ['TL', 'CH', 'SH', 'WA', 'HP'],
    // Accessories - Bags
    'bag': BAG_POMS,
    'duffle': BAG_POMS,
    'tote': BAG_POMS,
    'shoulder': BAG_POMS,
    'sling': BAG_POMS,
    'handle': BAG_POMS,
    'travel': BAG_POMS,
    // Headwear
    'hat': HAT_POMS,
    'cap': HAT_POMS,
    'beanie': HAT_POMS,
    'bucket': HAT_POMS,
    'trucker': HAT_POMS,
    // Accessories - Small
    'belt': BELT_POMS,
    'wallet': ['WI', 'HT', 'DP'],
    'card holder': ['WI', 'HT'],
    'gloves': ['WI', 'HT'],
    // Jewelry/Eyewear - minimal measurements
    'watch': ['WI'],
    'glasses': ['WI'],
    'sunglasses': ['WI'],
    'ring': [],
    'necklace': ['TL'], // Total length
};

function getPOMsForApparel(name: string): string[] {
    const lowerName = name.toLowerCase();
    for (const [pattern, poms] of Object.entries(APPAREL_POM_MAP)) {
        if (lowerName.includes(pattern)) return poms;
    }
    // Default to top POMs for unknown apparel
    return TOP_POMS;
}

async function seedApparelPOMs() {
    const client = await db.getClient();
    try {
        console.log('Starting POM mapping seeding...');

        // Clear existing mappings to fix errors
        await client.query('DELETE FROM apparel_pom_mappings');
        console.log('Cleared existing POM mappings');

        // Get all POM definitions
        const pomResult = await client.query(`SELECT id, code, name FROM pom_definitions`);
        const pomByCode = new Map(pomResult.rows.map((r: any) => [r.code, r.id]));
        console.log(`Found ${pomResult.rows.length} POM definitions`);

        // Get all apparel
        const apparelResult = await client.query(`SELECT id, name FROM vufs_attribute_values WHERE type_slug = 'apparel'`);
        console.log(`Found ${apparelResult.rows.length} apparel types`);

        let totalMappings = 0;
        for (const apparel of apparelResult.rows) {
            const pomCodes = getPOMsForApparel(apparel.name);
            console.log(`Processing: ${apparel.name} -> ${pomCodes.length} POMs`);

            for (let i = 0; i < pomCodes.length; i++) {
                const pomId = pomByCode.get(pomCodes[i]);
                if (!pomId) {
                    console.log(`  Warning: POM code ${pomCodes[i]} not found`);
                    continue;
                }

                try {
                    await client.query(`
                        INSERT INTO apparel_pom_mappings (apparel_id, pom_id, is_required, sort_order)
                        VALUES ($1, $2, $3, $4)
                    `, [apparel.id, pomId, i < 3, i + 1]); // First 3 POMs are required
                    totalMappings++;
                } catch (e: any) {
                    console.log(`  Error mapping ${pomCodes[i]}: ${e.message}`);
                }
            }
        }

        console.log(`\nSeeding complete! Created ${totalMappings} POM mappings.`);
    } finally {
        client.release();
    }
}

seedApparelPOMs().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
