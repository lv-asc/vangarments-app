const { Storage } = require('@google-cloud/storage');
const path = require('path');

async function testUpload() {
    const keyFilePath = path.join(__dirname, 'packages/backend/gcp-key.json');
    const storage = new Storage({ keyFilename: keyFilePath });
    const bucketName = 'vangarments-storage';
    const filename = 'test-sync.txt';
    const content = 'This is a test file for sync verification.';

    try {
        console.log(`Uploading ${filename} to ${bucketName}...`);
        await storage.bucket(bucketName).file(filename).save(content);
        console.log('Upload successful!');

        const [exists] = await storage.bucket(bucketName).file(filename).exists();
        console.log('File exists in GCS:', exists);
    } catch (e) {
        console.error('Upload failed:', e.message);
    }
}

testUpload();
