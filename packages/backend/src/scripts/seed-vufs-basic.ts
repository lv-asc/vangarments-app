
import 'dotenv/config';
import { VUFSManagementService } from '../services/vufsManagementService';
import { db } from '../database/connection';

async function seedVUFS() {
    console.log('Starting VUFS Basic Seeding...');

    try {
        // --- Categories ---
        console.log('Seeding Categories...');
        // Level 1: Page
        const apparel = await VUFSManagementService.addCategory('Apparel', 'page');
        // const footwear = await VUFSManagementService.addCategory('Footwear', 'page'); // Handled by standard lists usually but let's be explicit if needed

        // Level 2: Blue (Main Categories)
        // Tops
        const tops = await VUFSManagementService.addCategory('Tops', 'blue', apparel.id);
        await VUFSManagementService.addCategory('T-Shirts', 'white', tops.id);
        await VUFSManagementService.addCategory('Shirts', 'white', tops.id);
        await VUFSManagementService.addCategory('Blouses', 'white', tops.id);
        await VUFSManagementService.addCategory('Sweaters', 'white', tops.id);

        // Bottoms
        const bottoms = await VUFSManagementService.addCategory('Bottoms', 'blue', apparel.id);
        await VUFSManagementService.addCategory('Jeans', 'white', bottoms.id);
        await VUFSManagementService.addCategory('Pants', 'white', bottoms.id);
        await VUFSManagementService.addCategory('Skirts', 'white', bottoms.id);
        await VUFSManagementService.addCategory('Shorts', 'white', bottoms.id);

        // Dresses
        const dresses = await VUFSManagementService.addCategory('Dresses', 'blue', apparel.id);
        await VUFSManagementService.addCategory('Day Dresses', 'white', dresses.id);
        await VUFSManagementService.addCategory('Evening Dresses', 'white', dresses.id);

        // Outerwear
        const outerwear = await VUFSManagementService.addCategory('Outerwear', 'blue', apparel.id);
        await VUFSManagementService.addCategory('Coats', 'white', outerwear.id);
        await VUFSManagementService.addCategory('Jackets', 'white', outerwear.id);
        await VUFSManagementService.addCategory('Blazers', 'white', outerwear.id);

        // Shoes
        const shoes = await VUFSManagementService.addCategory('Shoes', 'blue', apparel.id); // Or separate page? Keeping simple for now
        await VUFSManagementService.addCategory('Sneakers', 'white', shoes.id);
        await VUFSManagementService.addCategory('Boots', 'white', shoes.id);
        await VUFSManagementService.addCategory('Sandals', 'white', shoes.id);
        await VUFSManagementService.addCategory('Heels', 'white', shoes.id);

        // Accessories
        const accessories = await VUFSManagementService.addCategory('Accessories', 'blue', apparel.id);
        await VUFSManagementService.addCategory('Bags', 'white', accessories.id);
        await VUFSManagementService.addCategory('Jewelry', 'white', accessories.id);
        await VUFSManagementService.addCategory('Belts', 'white', accessories.id);

        // --- Brands ---
        console.log('Seeding Brands...');
        const brands = [
            'Zara', 'H&M', 'Nike', 'Adidas', 'Gucci', 'Prada', 'Levi\'s', 'Uniqlo',
            'Ralph Lauren', 'Calvin Klein', 'Tommy Hilfiger', 'SHEIN', 'Framer',
            'Gap', 'Forever 21', 'Louis Vuitton', 'Chanel', 'Dior', 'Balenciaga'
        ];
        await VUFSManagementService.bulkAddItems('brand', brands);

        // --- Colors ---
        console.log('Seeding Colors...');
        const colors = [
            { name: 'Black', hex: '#000000' },
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Gray', hex: '#808080' },
            { name: 'Blue', hex: '#0000FF' },
            { name: 'Red', hex: '#FF0000' },
            { name: 'Green', hex: '#008000' },
            { name: 'Yellow', hex: '#FFFF00' },
            { name: 'Pink', hex: '#FFC0CB' },
            { name: 'Purple', hex: '#800080' },
            { name: 'Orange', hex: '#FFA500' },
            { name: 'Brown', hex: '#A52A2A' },
            { name: 'Beige', hex: '#F5F5DC' },
            { name: 'Navy', hex: '#000080' },
            { name: 'Cream', hex: '#FFFDD0' },
            { name: 'Gold', hex: '#FFD700' },
            { name: 'Silver', hex: '#C0C0C0' },
        ];
        for (const c of colors) {
            try {
                await VUFSManagementService.addColor(c.name, c.hex);
            } catch (e: any) {
                if (!e.message.includes('already exists')) console.error(e);
            }
        }

        // --- Materials ---
        console.log('Seeding Materials...');
        const materials = [
            { name: 'Cotton', category: 'natural' },
            { name: 'Wool', category: 'natural' },
            { name: 'Silk', category: 'natural' },
            { name: 'Linen', category: 'natural' },
            { name: 'Leather', category: 'natural' },
            { name: 'Polyester', category: 'synthetic' },
            { name: 'Nylon', category: 'synthetic' },
            { name: 'Spandex', category: 'synthetic' },
            { name: 'Rayon', category: 'synthetic' },
            { name: 'Acrylic', category: 'synthetic' },
            { name: 'Denim', category: 'blend' }, // Often blend or cotton
            { name: 'Velvet', category: 'blend' },
        ];
        for (const m of materials) {
            try {
                await VUFSManagementService.addMaterial(m.name, m.category);
            } catch (e: any) {
                if (!e.message.includes('already exists')) console.error(e);
            }
        }

        // --- Patterns ---
        console.log('Seeding Patterns...');
        const patterns = [
            'Solid', 'Striped', 'Polka Dot', 'Floral', 'Plaid', 'Checkered', 'Animal Print', 'Geometric', 'Tie Dye', 'Camouflage'
        ];
        await VUFSManagementService.bulkAddItems('pattern', patterns);

        // --- Fits ---
        console.log('Seeding Fits...');
        const fits = [
            'Regular', 'Slim', 'Oversized', 'Loose', 'Tight', 'Skinny', 'Straight', 'Relaxed'
        ];
        await VUFSManagementService.bulkAddItems('fit', fits);


        // --- Sizes ---
        console.log('Seeding Sizes...');
        const sizes = [
            'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL',
            '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'
        ];
        await VUFSManagementService.bulkAddItems('size', sizes);


        console.log('VUFS Basic Seeding Completed Successfully!');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        // Close DB connection if needed, though often kept alive in app. 
        // For a script, we might want to exit.
        process.exit(0);
    }
}

seedVUFS();
