import './src/env';
import { SizeModel } from './src/models/Size';
import { db } from './src/database/connection';

async function test() {
    try {
        console.log('Fetching sizes...');
        const sizes = await SizeModel.findAll();
        if (sizes.length < 2) {
            console.log('Not enough sizes to test reorder');
            return;
        }

        const reversedOrders = sizes.slice().reverse().map((s, idx) => ({
            id: s.id,
            sortOrder: idx + 1
        }));

        console.log('Testing reorder with payload:', JSON.stringify(reversedOrders, null, 2));
        await SizeModel.updateOrder(reversedOrders);
        console.log('Reorder successful in script!');

        const updatedSizes = await SizeModel.findAll();
        console.log('Updated order names:', updatedSizes.map(s => s.name).join(', '));
    } catch (error: any) {
        console.error('Reorder test failed with error:', error);
    } finally {
        await db.close();
    }
}

test();
