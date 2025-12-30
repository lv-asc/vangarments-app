import 'dotenv/config';
import { db } from '../database/connection';

const categories = [
    {
        name: 'Natural Plant-Based Fibers',
        description: 'Fibers from seeds, stems, or leaves (Cellulosic).',
        items: ['Cotton', 'Organic Cotton', 'Linen', 'Hemp', 'Jute', 'Ramie', 'Bamboo', 'Sisal', 'Kapok', 'Coir']
    },
    {
        name: 'Natural Animal-Based Fibers',
        description: 'Fibers harvested from animals or insects (Protein).',
        items: ['Wool', 'Merino Wool', 'Cashmere', 'Mohair', 'Angora', 'Alpaca', 'Silk', 'Camel', 'Yak', 'Llama', 'Vicuna']
    },
    {
        name: 'Regenerated / Semi-Synthetic Fibers',
        description: 'Man-made but created from natural cellulose (usually wood pulp).',
        items: ['Viscose', 'Modal', 'Lyocell', 'Acetate', 'Triacetate', 'Cupro', 'Bamboo Viscose']
    },
    {
        name: 'Synthetic Fibers',
        description: 'Man-made polymers derived from oil (Petroleum-Based).',
        items: ['Polyester', 'Recycled Polyester', 'Polyamide', 'Elastane', 'Acrylic', 'Modacrylic', 'Polypropylene', 'Polyurethane']
    },
    {
        name: 'Mineral & Metallic Fibers',
        description: 'Used for decorative effects, protection, or tech-wear.',
        items: ['Metallic Fiber', 'Glass Fiber', 'Carbon Fiber', 'Steel', 'Copper']
    }
];

async function seed() {
    console.log('🌱 Seeding Compositions...');

    try {
        for (const cat of categories) {
            // Insert Category
            const catRes = await db.query(
                `INSERT INTO vufs_composition_categories (name, description) 
                 VALUES ($1, $2) 
                 ON CONFLICT (name) DO UPDATE SET description = $2
                 RETURNING id`,
                [cat.name, cat.description]
            );
            const catId = catRes.rows[0].id;
            console.log(`Created Category: ${cat.name}`);

            // Insert Items
            for (const item of cat.items) {
                await db.query(
                    `INSERT INTO vufs_compositions (name, category_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT (name) DO UPDATE SET category_id = $2`,
                    [item, catId]
                );
            }
            console.log(`  Added ${cat.items.length} items.`);
        }
        console.log('✅ Seeding complete.');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await db.close();
    }
}

seed();
