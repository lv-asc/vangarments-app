import 'dotenv/config';
import { db } from '../database/connection';

interface PatternData {
    name: string;
    description?: string;
    subcategory?: string;
}

const patternsData: Record<string, { subcategory?: string; patterns: PatternData[] }> = {
    'geometric': {
        patterns: [
            // Checks & Plaids subcategory
            { name: 'Argyle', description: 'Overlapping lozenges or diamonds arranged diagonally, typically with crossing pinstripes', subcategory: 'Checks & Plaids' },
            { name: 'Checkered', description: 'Side-by-side squares in alternating colors', subcategory: 'Checks & Plaids' },
            { name: 'Gingham', description: 'A checkerboard pattern of white plus one other color, creating intermediate lightened squares where they overlap', subcategory: 'Checks & Plaids' },
            { name: 'Glen Plaid', description: 'A woven pattern of small and large checks, often used in suiting', subcategory: 'Checks & Plaids' },
            { name: 'Houndstooth', description: 'Broken checks or abstract four-pointed shapes, traditionally in black and white', subcategory: 'Checks & Plaids' },
            { name: 'Plaid / Tartan', description: 'Crisscrossed horizontal and vertical bands of multiple colors and widths', subcategory: 'Checks & Plaids' },
            { name: 'Windowpane', description: 'Wide, evenly spaced lines that form large, square grids', subcategory: 'Checks & Plaids' },
            
            // Stripes subcategory
            { name: 'Awning Stripes', description: 'Relatively wide, even, usually vertical solid color stripes on a lighter ground', subcategory: 'Stripes' },
            { name: 'Bengal Stripes', description: 'Alternating light and dark stripes of the same width', subcategory: 'Stripes' },
            { name: 'Chevron', description: 'V-shaped zigzag lines resembling a series of arrows', subcategory: 'Stripes' },
            { name: 'Pinstripe', description: 'Very thin lines, typically one or two yarns thick', subcategory: 'Stripes' },
            
            // Motifs subcategory
            { name: 'Greek Key', description: 'A continuous linear pattern of repeating and sinuous right-angled lines', subcategory: 'Motifs' },
            { name: 'Harlequin', description: 'Alternating diamond shapes, often in contrasting colors', subcategory: 'Motifs' },
            { name: 'Polka Dot', description: 'Evenly spaced, same-sized round dots on a solid background', subcategory: 'Motifs' },
        ]
    },
    'organic': {
        patterns: [
            { name: 'Animal Prints', description: 'Replicas of animal skins or furs, such as leopard, zebra, snake, and alligator' },
            { name: 'Botanical', description: 'Realistic or stylized depictions of herbs, garden plants, and leaves' },
            { name: 'Floral', description: 'Associated with any plant form, ranging from small "Ditsy" blossoms to bold, large blooms' },
            { name: 'Paisley', description: 'Intricate, teardrop-shaped motifs with curved ends and embellished floral details' },
            { name: 'Toile (Toile de Jouy)', description: 'Detailed, monochromatic scenes of pastoral life, landscapes, or classical arrangements' },
        ]
    },
    'abstract': {
        patterns: [
            { name: 'Abstract', description: 'Unrecognizable forms, layouts, and brush strokes' },
            { name: 'Airbrush', description: 'Blurry, soft patterns imitating the light and modern look of a spray gun' },
            { name: 'Graphic', description: 'Bold, predominantly modern designs that can be used alone or combined with other motifs' },
            { name: 'Gradient / Ombré', description: 'Smooth transitions where colors or tones shade into each other' },
            { name: 'Lightning', description: 'Stylized, jagged lines mimicking electrical discharges' },
            { name: 'Tie-Dye / Batik', description: 'Designs with a blurred or "wax-resist" appearance created through specialized dyeing techniques' },
        ]
    },
    'technical': {
        patterns: [
            // Washes subcategory
            { name: 'Acid Wash', description: 'A process that creates high-contrast faded effects, common in denim', subcategory: 'Washes' },
            { name: 'Washed / Stone-Wash', description: 'General terminology for garments treated to look softer or aged', subcategory: 'Washes' },
            
            // Construction Textures subcategory
            { name: 'Basketweave', description: 'A pattern resembling the interlaced structure of a basket', subcategory: 'Construction Textures' },
            { name: 'Damask / Jacquard', description: 'Patterns woven directly into the fabric using a specialized loom, often creating a raised, formal effect', subcategory: 'Construction Textures' },
            { name: 'Embroidered', description: 'Motifs added to the fabric surface using decorative needlework', subcategory: 'Construction Textures' },
            { name: 'Herringbone', description: 'A subtle jagged texture resembling the skeleton of a fish', subcategory: 'Construction Textures' },
        ]
    },
    'novelty': {
        patterns: [
            { name: 'Conversational / Object Prints', description: 'Designs with recognizable icons, such as everyday tools, cartoon animals, or pop-culture symbols' },
            { name: 'Camo (Camouflage)', description: 'Curvy patterns originally developed for military use to blend into natural environments' },
            { name: 'Tribal / Ethnic', description: 'Prints reflecting the symbolic motifs, bold colors, and heritage of indigenous cultures' },
        ]
    }
};

async function seedPatterns() {
    try {
        console.log('Starting pattern seeding...\n');

        // Get all groups
        const groupsResult = await db.query('SELECT id, slug FROM vufs_pattern_groups ORDER BY sort_order');
        const groups = groupsResult.rows;

        // Get all subcategories
        const subcatsResult = await db.query('SELECT id, name, group_id FROM vufs_pattern_subcategories');
        const subcategories = subcatsResult.rows;

        let totalAdded = 0;
        let totalSkipped = 0;

        for (const group of groups) {
            const groupData = patternsData[group.slug];
            if (!groupData) continue;

            console.log(`\n📁 Processing group: ${group.slug}`);

            for (const patternData of groupData.patterns) {
                // Find subcategory if specified
                let subcategoryId = null;
                if (patternData.subcategory) {
                    const subcat = subcategories.find(
                        s => s.name === patternData.subcategory && s.group_id === group.id
                    );
                    if (subcat) {
                        subcategoryId = subcat.id;
                    }
                }

                // Check if pattern already exists
                const existingPattern = await db.query(
                    'SELECT id FROM vufs_patterns WHERE name = $1',
                    [patternData.name]
                );

                if (existingPattern.rows.length > 0) {
                    console.log(`  ⏭️  Skipped: ${patternData.name} (already exists)`);
                    totalSkipped++;
                    continue;
                }

                // Insert pattern
                await db.query(
                    `INSERT INTO vufs_patterns (name, description, group_id, subcategory_id, is_active)
                     VALUES ($1, $2, $3, $4, true)`,
                    [patternData.name, patternData.description || null, group.id, subcategoryId]
                );

                const subcatLabel = patternData.subcategory ? ` → ${patternData.subcategory}` : '';
                console.log(`  ✅ Added: ${patternData.name}${subcatLabel}`);
                totalAdded++;
            }
        }

        console.log(`\n\n🎉 Seeding complete!`);
        console.log(`   Added: ${totalAdded} patterns`);
        console.log(`   Skipped: ${totalSkipped} patterns (already existed)`);

        // Show summary by group
        console.log('\n📊 Summary by group:');
        const summaryResult = await db.query(`
            SELECT 
                g.emoji,
                g.name as group_name,
                COUNT(p.id) as pattern_count
            FROM vufs_pattern_groups g
            LEFT JOIN vufs_patterns p ON p.group_id = g.id AND p.is_active = true AND (p.is_deleted = false OR p.is_deleted IS NULL)
            GROUP BY g.id, g.emoji, g.name, g.sort_order
            ORDER BY g.sort_order
        `);

        summaryResult.rows.forEach((row: any) => {
            console.log(`   ${row.emoji} ${row.group_name}: ${row.pattern_count} patterns`);
        });

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        process.exit();
    }
}

seedPatterns();
