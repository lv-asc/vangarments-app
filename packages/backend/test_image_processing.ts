import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function testImageProcessing() {
    console.log('=== Image Processing Test ===\n');

    try {
        // 1. Check if sharp is available
        console.log('1. Testing sharp library...');
        const testBuffer = Buffer.from('test');
        try {
            await sharp({
                create: {
                    width: 100,
                    height: 100,
                    channels: 3,
                    background: { r: 255, g: 0, b: 0 }
                }
            }).png().toBuffer();
            console.log('✓ Sharp is working\n');
        } catch (e) {
            console.log('✗ Sharp failed:', e);
            return;
        }

        // 2. Check storage directory
        console.log('2. Checking storage directory...');
        const storageRoot = path.join(process.cwd(), 'storage');
        const imagesDir = path.join(storageRoot, 'images', 'profiles');

        try {
            await fs.access(storageRoot);
            console.log(`✓ Storage root exists: ${storageRoot}`);
        } catch {
            console.log(`✗ Storage root missing: ${storageRoot}`);
            await fs.mkdir(storageRoot, { recursive: true });
            console.log('  Created storage root');
        }

        try {
            await fs.access(imagesDir);
            console.log(`✓ Images directory exists: ${imagesDir}`);
        } catch {
            console.log(`✗ Images directory missing: ${imagesDir}`);
            await fs.mkdir(imagesDir, { recursive: true });
            console.log('  Created images directory');
        }

        // 3. Test write permissions
        console.log('\n3. Testing write permissions...');
        const testFile = path.join(imagesDir, 'test_write.txt');
        try {
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            console.log('✓ Storage directory is writable\n');
        } catch (e) {
            console.log('✗ Cannot write to storage:', e);
            return;
        }

        // 4. List existing files
        console.log('4. Listing existing profile images...');
        try {
            const files = await fs.readdir(imagesDir, { recursive: true });
            console.log(`Found ${files.length} items in profiles directory:`);
            files.slice(0, 10).forEach(f => console.log(`  - ${f}`));
            if (files.length > 10) console.log(`  ... and ${files.length - 10} more`);
        } catch (e) {
            console.log('Error listing files:', e);
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testImageProcessing().then(() => process.exit(0));
