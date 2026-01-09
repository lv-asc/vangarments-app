const { Storage } = require('@google-cloud/storage');
const path = require('path');

async function listAll() {
    const storage = new Storage({
        keyFilename: path.join(__dirname, 'packages/backend/gcp-key.json')
    });

    try {
        const [buckets] = await storage.getBuckets();
        for (const bucket of buckets) {
            console.log(`Bucket: ${bucket.name}`);
            const [files] = await bucket.getFiles();
            if (files.length === 0) {
                console.log(' (empty)');
            } else {
                files.forEach(f => console.log(` - ${f.name}`));
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

listAll();
