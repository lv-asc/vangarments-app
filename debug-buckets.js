const { Storage } = require('@google-cloud/storage');
const path = require('path');

async function listAll() {
    const storage = new Storage({
        keyFilename: path.join(__dirname, 'packages/backend/gcp-key.json')
    });

    try {
        const [buckets] = await storage.getBuckets();
        console.log('Available Buckets:');
        for (const bucket of buckets) {
            console.log(`- ${bucket.name}`);
            try {
                const [files] = await bucket.getFiles({ maxResults: 5 });
                if (files.length > 0) {
                    console.log(`  Sample files in ${bucket.name}:`);
                    files.forEach(f => console.log(`    - ${f.name}`));
                } else {
                    console.log(`  Bucket ${bucket.name} is empty.`);
                }
            } catch (e) {
                console.log(`  Could not list files in ${bucket.name}: ${e.message}`);
            }
        }
    } catch (e) {
        console.error('Error listing buckets:', e.message);
    }
}

listAll();
