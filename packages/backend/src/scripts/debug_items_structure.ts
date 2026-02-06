
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function debugItemsStructure() {
    try {
        console.log('🧪 Debugging Items Structure...');

        // Login
        console.log(`\n1️⃣ Logging in...`);
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'lvicentini10@gmail.com',
            password: 'alt-FutLV1'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful.');

        // Get Wardrobe Items
        console.log('\n2️⃣ Fetching Wardrobe Items...');
        const response = await axios.get(`${API_BASE_URL}/wardrobe/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.items && response.data.items.length > 0) {
            console.log('✅ Got item. Structure:');
            console.log(JSON.stringify(response.data.items[0], null, 2));
        } else {
            console.log('⚠️ No items found in wardrobe.');
        }

        // Get Facets
        console.log('\n3️⃣ Fetching Facets...');
        const facetsRes = await axios.get(`${API_BASE_URL}/wardrobe/items/facets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Facets structure:');
        console.log(JSON.stringify(facetsRes.data, null, 2));

    } catch (error: any) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugItemsStructure();
