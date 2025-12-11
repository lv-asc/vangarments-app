
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { UserModel } from '../models/User';
import { db } from '../database/connection';
import fs from 'fs';

async function findUser() {
    try {
        const email = 'lvicentini10@gmail.com';
        const user = await UserModel.findByEmail(email);
        const outputPath = '/tmp/v_user_id.txt';
        if (user) {
            console.log(`FOUND_USER_ID:${user.id}`);
            fs.writeFileSync(outputPath, user.id);
        } else {
            console.log('User not found');
            fs.writeFileSync(outputPath, 'NOT_FOUND');
        }
    } catch (error) {
        console.error('Error finding user:', error);
        fs.writeFileSync('/tmp/v_user_id.txt', `ERROR: ${error}`);
    } finally {
        process.exit(0);
    }
}

findUser();
