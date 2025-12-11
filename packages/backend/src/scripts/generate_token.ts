
import path from 'path';
import dotenv from 'dotenv';
// Load environment variables from the correct location
dotenv.config({ path: path.join(__dirname, '../../.env') });

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const payload = {
    userId: '6a0b5116-8b9c-4ea9-97c5-8cb7b484699a',
    email: 'lvicentini10@gmail.com',
    role: 'admin'
};

const token = jwt.sign(payload, JWT_SECRET);
console.log(token);
