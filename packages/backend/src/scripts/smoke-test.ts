import request from 'supertest';

const BASE_URL = 'http://localhost:3001';

async function runSmokeTest() {
    console.log('--- Starting Live API Smoke Test ---');

    // 1. Health Check
    try {
        const res = await request(BASE_URL).get('/api/health');
        console.log(`GET /api/health: ${res.status} (Expected 200)`);
    } catch (err) {
        console.error('GET /api/health failed:', err);
    }

    // 2. Profile Endpoint (GET)
    try {
        const res = await request(BASE_URL).get('/api/users/123/profile');
        // Should be 404 (User not found) or 200, but NOT 404 (Endpoint not found)
        // Wait, "Endpoint not found" from our middleware has a specific body structure.
        // Standard 404 from controller also has 404.
        // We check the error code in body.
        console.log(`GET /api/users/123/profile: ${res.status}`);
        if (res.status === 404) {
            console.log('Body:', res.body);
        }
    } catch (err) {
        console.error('GET /api/users/123/profile failed:', err);
    }

    // 3. Profile Update (PUT) - Access Check
    try {
        const res = await request(BASE_URL).put('/api/users/profile');
        console.log(`PUT /api/users/profile: ${res.status} (Expected 401 Unauthorized)`);
        // If 404, it means route is missing. If 401, route is hitting middleware.
    } catch (err) {
        console.error('PUT /api/users/profile failed:', err);
    }

    // 4. Avatar Upload (POST) - Access Check
    try {
        const res = await request(BASE_URL).post('/api/users/avatar');
        console.log(`POST /api/users/avatar: ${res.status} (Expected 401 Unauthorized)`);
    } catch (err) {
        console.error('POST /api/users/avatar failed:', err);
    }

    // 5. Wardrobe Items (GET) - Access Check
    try {
        const res = await request(BASE_URL).get('/api/wardrobe/items');
        console.log(`GET /api/wardrobe/items: ${res.status} (Expected 401 Unauthorized)`);
    } catch (err) {
        console.error('GET /api/wardrobe/items failed:', err);
    }

    process.exit(0);
}

runSmokeTest();
