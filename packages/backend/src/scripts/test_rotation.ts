
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function testRotation(inputPath: string) {
    try {
        if (!fs.existsSync(inputPath)) {
            console.error('Input file not found:', inputPath);
            return;
        }

        console.log('Testing rotation for:', inputPath);
        const metadata = await sharp(inputPath).metadata();
        console.log('Original Metadata:', {
            width: metadata.width,
            height: metadata.height,
            orientation: metadata.orientation || 'undefined'
        });

        // Test auto-rotation
        const outputPath = inputPath.replace('.png', '_rotated.png').replace('.jpg', '_rotated.jpg');
        await sharp(inputPath)
            .rotate()
            .toFile(outputPath);

        const newMetadata = await sharp(outputPath).metadata();
        console.log('Rotated Metadata:', {
            width: newMetadata.width,
            height: newMetadata.height,
            orientation: newMetadata.orientation || 'undefined'
        });

        console.log('Rotated image saved to:', outputPath);

    } catch (error) {
        console.error('Rotation test failed:', error);
    }
}

const targetImage = process.argv[2];
if (targetImage) {
    testRotation(targetImage);
} else {
    console.log('Usage: npx ts-node test_rotation.ts <path-to-image>');
}
