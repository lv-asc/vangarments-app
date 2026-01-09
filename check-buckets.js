const { Storage } = require('@google-cloud/storage');
const path = require('path');

async function checkBucket(bucketName) {
    const storage = new Storage({
        keyFilename: path.join(__dirname, 'packages/backend/gcp-key.json')
    });

    try {
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();
        console.log(`Bucket ${bucketName} exists: ${exists}`);
        if (exists) {
            const [files] = await bucket.getFiles({ maxResults: 5 });
            console.log(`Files in ${bucketName}:`);
            files.forEach(f => console.log(` - ${f.name}`));
        }
    } catch (e) {
        console.error(`Error checking ${bucketName}:`, e.message);
    }
}

async function run() {
    await checkBucket('nodal-deck-481823-e8.appspot.com');
    await checkBucket('vangarments-prod-storage');
    await checkBucket('vangarments-images');
}

run();
