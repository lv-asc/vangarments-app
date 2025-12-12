#!/usr/bin/env node

import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

const API_BASE_URL = 'http://localhost:3001/api';

async function logResponseError(error: any) {
    console.error('❌ Request failed:', error.message);
    if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
}

async function debugWardrobeFetch() {
    try {
        console.log('🧪 Debugging Wardrobe Fetch Error...');

        // Login as admin
        console.log(`\n1️⃣ Logging in as admin...`);

        const loginResponse = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
            email: 'lv@vangarments.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Admin login successful, token received.');

        // Test Endpoint 1: /api/wardrobe/items
        console.log('\n2️⃣ Testing GET /api/wardrobe/items ...');
        try {
            const response = await axios.get(`${API_BASE_URL}/wardrobe/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ /api/wardrobe/items success:', response.status);
            console.log('   Items count:', response.data.data?.items?.length || response.data.length || 0);
        } catch (error: any) {
            console.log('❌ /api/wardrobe/items FAILED');
            await logResponseError(error);
        }

        // Test Endpoint 2: /api/vufs/items/my
        console.log('\n3️⃣ Testing GET /api/vufs/items/my ...');
        try {
            const response = await axios.get(`${API_BASE_URL}/vufs/items/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ /api/vufs/items/my success:', response.status);
            console.log('   Items count:', response.data.data?.items?.length || response.data.length || 0);
        } catch (error: any) {
            console.log('❌ /api/vufs/items/my FAILED');
            await logResponseError(error);
        }

    } catch (error: any) {
        console.error('❌ Setup failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugWardrobeFetch();
