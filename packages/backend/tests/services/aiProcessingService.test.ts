import { AIProcessingService } from '../../src/services/aiProcessingService';

describe('AIProcessingService', () => {
    describe('processItemImage', () => {
        const mockImageBuffer = Buffer.from('fake-image-data');

        it('should return mock analysis for a front image', async () => {
            const result = await AIProcessingService.processItemImage(mockImageBuffer, 'shirt_front.jpg');

            expect(result.detectedViewpoint).toBe('Front');
            expect(result.domain).toBe('APPAREL');
            expect(result.detectedPieceType).toBe('Tops');
        });

        it('should detect footwear domain correctly from filename', async () => {
            const result = await AIProcessingService.processItemImage(mockImageBuffer, 'my_sneaker.jpg');

            expect(result.domain).toBe('FOOTWEAR');
            expect(result.detectedPieceType).toBe('Sneakers');
        });

        it('should detect viewpoint correctly from filename', async () => {
            const result = await AIProcessingService.processItemImage(mockImageBuffer, 'image_back_view.jpg');
            expect(result.detectedViewpoint).toBe('Back');

            const tagResult = await AIProcessingService.processItemImage(mockImageBuffer, 'label_tag.jpg');
            expect(tagResult.detectedViewpoint).toBe('Main Tag');
        });
    });

    describe('extractVUFSProperties', () => {
        it('should extract properties from mock analysis', async () => {
            const result = await AIProcessingService.extractVUFSProperties(
                Buffer.from('test'),
                'blue_shirt.jpg'
            );

            expect(result.category.page).toBe('Apparel');
            expect(result.confidence.overall).toBeGreaterThan(0);
            expect(result.suggestions).toBeDefined();
        });
    });
});
