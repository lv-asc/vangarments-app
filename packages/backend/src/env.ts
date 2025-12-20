import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Explicitly load .env from current working directory or specific path
const envPath = path.resolve(process.cwd(), '.env');

// Only attempt to load .env if it exists (avoids crash in production containers)
if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.warn('⚠️  Failed to load .env file:', result.error);
    } else {
        console.log('✅ Environment variables loaded from .env');
        console.log('Postgres Host:', process.env.DATABASE_URL ? 'Configured' : 'Missing');
    }
} else {
    console.log('ℹ️  No .env file found - using environment variables from container');
}
