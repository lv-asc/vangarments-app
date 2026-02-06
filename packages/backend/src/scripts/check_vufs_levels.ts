
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function checkVUFSOptions() {
    try {
        console.log('🧪 Checking VUFS Options...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'lvicentini10@gmail.com',
            password: 'alt-FutLV1'
        });
        const token = loginResponse.data.token;

        const response = await axios.get(`${API_BASE_URL}/wardrobe/vufs-options`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const cats = response.data.options.categories || [];
        console.log(`Total Categories: ${cats.length}`);

        // Let's see unique "page" values (Level 1)
        const pages = [...new Set(cats.map((c: any) => c.page))];
        console.log('Pages (Level 1):', pages.slice(0, 10));

        // Let's see unique "graySubcategory" values (Level 4)
        const grays = [...new Set(cats.map((c: any) => c.graySubcategory).filter(Boolean))];
        console.log('Gray Subcategories (Level 4):', grays.slice(0, 10));

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkVUFSOptions();
