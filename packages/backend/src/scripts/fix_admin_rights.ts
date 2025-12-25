
import { db } from '../database/connection';
import { ConversationModel } from '../models/Conversation';

async function restoreCreatorAdmin() {
    const slug = 'vang-bros-e1296';
    console.log(`Looking for conversation with slug: ${slug}`);

    try {
        const conversation = await ConversationModel.findById(slug);
        if (!conversation) {
            console.error('Conversation not found');
            process.exit(1);
        }

        console.log(`Found conversation: ${conversation.name} (${conversation.id})`);
        console.log(`Created by: ${conversation.createdBy}`);

        if (!conversation.createdBy) {
            console.error('No creator found for this conversation');
            process.exit(1);
        }

        // Check current role
        const participants = await ConversationModel.getParticipants(conversation.id);
        const creatorParticipant = participants.find(p => p.userId === conversation.createdBy);

        if (!creatorParticipant) {
            console.error('Creator is not a participant!');
            // Ideally we should add them back, but let's assume they are there based on screenshot
            process.exit(1);
        }

        console.log(`Creator username: ${creatorParticipant.user?.username}`);
        // Find user 'v'
        const usersResult = await db.query(`SELECT id FROM users WHERE username = 'v'`);
        if (usersResult.rows.length === 0) {
            console.error('User "v" not found');
            process.exit(1);
        }
        const vUserId = usersResult.rows[0].id;
        console.log(`User "v" ID: ${vUserId}`);

        if (conversation.createdBy !== vUserId) {
            console.log(`Current creator is ${conversation.createdBy} (trevizan?), but should be "v" (${vUserId}). Updating...`);
            await db.query(`UPDATE conversations SET created_by = $1 WHERE id = $2`, [vUserId, conversation.id]);
            console.log('Conversation creator updated.');
        }

        // Ensure "v" is admin
        await db.query(`UPDATE conversation_participants SET role = 'admin' WHERE conversation_id = $1 AND user_id = $2`, [conversation.id, vUserId]);
        console.log('User "v" is now an admin.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

restoreCreatorAdmin();
