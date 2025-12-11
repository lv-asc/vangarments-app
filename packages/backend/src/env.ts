import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from current working directory or specific path
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (result.error) {
    console.warn('⚠️  Failed to load .env file:', result.error);
} else {
    console.log('✅ Environment variables loaded from .env');
    console.log('Postgres Host:', process.env.DATABASE_URL ? 'Configured' : 'Missing');
}
