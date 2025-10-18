import { AIProcessingService } from '../../src/services/aiProcessingService';
import { AWSService } from '../../src/services/awsService';
import { VUFSDomain } from '@vangarments/shared/types/vufs';

// Mock AWS Service
jest.mock('../../src/services/awsService');
const mockAWSService = AWSService as jest.Mocked<typeof AWSService>;

describe('AIProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processItemImage', () => {
    const mockImageBuffer = Buffer.from('fake-image-data');
    const mockFilename = 'test-image.jpg';

    beforeEach(() => {
      // Setup default mocks
      mockAWSService.removeBackground.mockResolvedValue(mockImageBuffer);
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/processed/test-image.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 },
        { Name: 'Blue', Confidence: 87.3 }
      ]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'Nike', Confidence: 92.1 },
        { Type: 'WORD', DetectedText: 'Nike', Confidence: 92.1 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        brand: 'Nike®',
        pieceType: 'Shirts',
        color: 'Blue',
        material: 'Cotton',
        confidence: 0.85
      });
    });

    it('should successfully process an image with all AI services', async () => {
      const result = await AIProcessingService.processItemImage(mockImageBuffer, mockFilename);

      expect(result).toEqual({
        domain: 'APPAREL',
        detectedBrand: 'Nike®',
        detectedPieceType: 'Shirts',
        detectedColor: 'Blue',
        detectedMaterial: 'Cotton',
        confidence: {
          overall: 85,
          brand: 70,
          pieceType: 80,
          color: 85,
          material: 60
        },
        rawLabels: [
          { Name: 'Clothing', Confidence: 95.5 },
          { Name: 'Shirt', Confidence: 89.2 },
          { Name: 'Blue', Confidence: 87.3 }
        ],
        detectedText: ['Nike'],
        backgroundRemoved: true,
        processedImageUrl: 'https://s3.amazonaws.com/processed/test-image.jpg'
      });

      expect(mockAWSService.removeBackground).toHaveBeenCalledWith(mockImageBuffer);
      expect(mockAWSService.uploadImage).toHaveBeenCalledWith(
        mockImageBuffer,
        expect.stringMatching(/^processed\/\d+-test-image\.jpg$/),
        'image/jpeg'
      );
      expect(mockAWSService.detectLabels).toHaveBeenCalledWith(mockImageBuffer);
      expect(mockAWSService.detectText).toHaveBeenCalledWith(mockImageBuffer);
      expect(mockAWSService.invokeFashionModel).toHaveBeenCalledWith(mockImageBuffer);
    });

    it('should handle background removal failure gracefully', async () => {
      mockAWSService.removeBackground.mockRejectedValue(new Error('Background removal failed'));

      const result = await AIProcessingService.processItemImage(mockImageBuffer, mockFilename);

      expect(result.backgroundRemoved).toBe(false);
      expect(result.processedImageUrl).toBeUndefined();
      expect(mockAWSService.detectLabels).toHaveBeenCalledWith(mockImageBuffer);
    });

    it('should handle custom model failure gracefully', async () => {
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const result = await AIProcessingService.processItemImage(mockImageBuffer, mockFilename);

      expect(result.confidence.overall).toBe(50); // Base confidence when custom model fails
      expect(result.detectedBrand).toBeNull();
    });

    it('should detect footwear domain correctly', async () => {
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Shoe', Confidence: 95.5 },
        { Name: 'Sneaker', Confidence: 89.2 },
        { Name: 'Athletic Shoe', Confidence: 87.3 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const result = await AIProcessingService.processItemImage(mockImageBuffer, mockFilename);

      expect(result.domain).toBe('FOOTWEAR');
    });

    it('should detect apparel domain correctly', async () => {
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 },
        { Name: 'Jacket', Confidence: 87.3 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const result = await AIProcessingService.processItemImage(mockImageBuffer, mockFilename);

      expect(result.domain).toBe('APPAREL');
    });
  });

  describe('confidence scoring', () => {
    it('should calculate high confidence when all attributes are detected', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 }
      ]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'Adidas', Confidence: 92.1 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        brand: 'Adidas®',
        pieceType: 'Shirts',
        color: 'Blue',
        material: 'Cotton',
        confidence: 0.92,
        brandConfidence: 88,
        pieceTypeConfidence: 91,
        colorConfidence: 89,
        materialConfidence: 75
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.confidence).toEqual({
        overall: 92,
        brand: 88,
        pieceType: 91,
        color: 89,
        material: 75
      });
    });

    it('should calculate low confidence when attributes are missing', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Object', Confidence: 45.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        confidence: 0.35
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.confidence.overall).toBe(35);
      expect(result.confidence.brand).toBe(0);
      expect(result.confidence.pieceType).toBe(0);
      expect(result.confidence.color).toBe(0);
      expect(result.confidence.material).toBe(0);
    });

    it('should use default confidence values when custom model provides partial data', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 85.5 },
        { Name: 'Blue', Confidence: 80.2 }
      ]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'Nike', Confidence: 88.1 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        brand: 'Nike®',
        pieceType: 'Shirts',
        color: 'Blue',
        confidence: 0.78
        // Missing specific confidence scores
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.confidence).toEqual({
        overall: 78,
        brand: 70, // Default value
        pieceType: 80, // Default value
        color: 85, // Default value
        material: 0 // No material detected
      });
    });
  });

  describe('brand detection', () => {
    it('should detect brand from text when present', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'adidas', Confidence: 92.1 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.detectedBrand).toBe('Adidas®');
    });

    it('should prioritize custom model brand detection over text', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'nike', Confidence: 92.1 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        brand: 'Adidas®'
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.detectedBrand).toBe('Adidas®');
    });

    it('should return null when no brand is detected', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'unknown text', Confidence: 92.1 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.detectedBrand).toBeNull();
    });
  });

  describe('piece type detection', () => {
    it('should detect apparel piece types correctly', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL'
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.domain).toBe('APPAREL');
      expect(result.detectedPieceType).toBe('Shirts');
    });

    it('should detect footwear types correctly', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Shoe', Confidence: 95.5 },
        { Name: 'Sneaker', Confidence: 89.2 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'FOOTWEAR'
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.domain).toBe('FOOTWEAR');
      expect(result.detectedPieceType).toBe('Sneakers');
    });

    it('should prioritize custom model piece type detection', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        pieceType: 'Jackets'
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.detectedPieceType).toBe('Jackets');
    });
  });

  describe('color detection', () => {
    it('should detect colors from labels', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Blue', Confidence: 89.2 },
        { Name: 'Navy', Confidence: 85.1 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.detectedColor).toBe('Blue');
    });

    it('should prioritize custom model color detection', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Blue', Confidence: 89.2 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        color: 'Red'
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.detectedColor).toBe('Red');
    });
  });

  describe('material detection', () => {
    it('should detect materials based on domain', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Cotton', Confidence: 78.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL'
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.domain).toBe('APPAREL');
      expect(result.detectedMaterial).toBe('Cotton');
    });

    it('should prioritize custom model material detection', async () => {
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Cotton', Confidence: 78.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        material: 'Polyester'
      });

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.detectedMaterial).toBe('Polyester');
    });
  });

  describe('error handling', () => {
    it('should handle AWS service errors gracefully', async () => {
      mockAWSService.removeBackground.mockRejectedValue(new Error('AWS Error'));
      mockAWSService.detectLabels.mockRejectedValue(new Error('Rekognition Error'));
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      await expect(
        AIProcessingService.processItemImage(Buffer.from('test'), 'test.jpg')
      ).rejects.toThrow('Rekognition Error');
    });

    it('should handle partial AWS service failures', async () => {
      mockAWSService.removeBackground.mockRejectedValue(new Error('Background removal failed'));
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 85.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const result = await AIProcessingService.processItemImage(
        Buffer.from('test'),
        'test.jpg'
      );

      expect(result.backgroundRemoved).toBe(false);
      expect(result.domain).toBe('APPAREL');
    });
  });
});