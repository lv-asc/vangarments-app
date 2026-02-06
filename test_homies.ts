
import { HomiesModel } from './packages/backend/src/models/Homies';
import { db } from './packages/backend/src/database/connection';

async function test() {
    try {
        const listId = '692008f3-dce7-44b5-bcb5-f58af14b021f';
        console.log('Testing getListMembers for list:', listId);
        const members = await HomiesModel.getListMembers(listId);
        console.log('Found members:', members.length);
        if (members.length > 0) {
            console.log('First member:', JSON.stringify(members[0], null, 2));
        } else {
            console.log('No members returned by the model.');
        }
        await db.close();
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
