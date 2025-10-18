import request from 'supertest';
import express from 'express';
import { AIController, uploadMiddleware } from '../../src/controllers/aiController';

// Mock AI Processing Service and AWS Service
jest.mock('../../src/services/aiProcessingService');
jest.mock('../../src/services/awsService');

import { AIProcessingService } from '../../src/services/aiProcessingService';
import { AWSService } from '../../src/services/awsService';

const mockAIProcessingService = AIProcessingService as jest.Mocked<typeof AIProcessingService>;
const mockAWSService = AWSService as jest.Mocked<typeof AWSService>;

// Mock fetch for URL processing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AI Image Processing Integration - Complete Workflows', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = { id: 'test-user-id', cpf: '12345678901' };
      next();
    });

    // Setup routes
    app.post('/ai/process', uploadMiddleware, AIController.processImage);
    app.post('/ai/analyze-url', AIController.analyzeImageUrl);
    app.post('/ai/batch-process', AIController.batchProcess);

    jest.clearAllMocks();
  });

  describe('Complete Image Processing Workflow', () => {
    beforeEach(() => {
      // Setup successful AWS service mocks
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed-image'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/processed/image.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 },
        { Name: 'Blue', Confidence: 87.3 },
        { Name: 'Cotton', Confidence: 78.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'Nike', Confidence: 92.1 },
        { Type: 'WORD', DetectedText: 'Nike', Confidence: 92.1 },
        { Type: 'LINE', DetectedText: 'Size M', Confidence: 88.5 }
      ]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        brand: 'Nike®',
        pieceType: 'Shirts',
        color: 'Blue',
        material: 'Cotton',
        confidence: 0.92,
        brandConfidence: 95,
        pieceTypeConfidence: 88,
        colorConfidence: 90,
        materialConfidence: 85
      });

      // Setup AI Processing Service mock - will be overridden in individual tests
      mockAIProcessingService.processItemImage.mockResolvedValue({
        domain: 'APPAREL',
        detectedBrand: 'Nike®',
        detectedPieceType: 'Shirts',
        detectedColor: 'Blue',
        detectedMaterial: 'Cotton',
        confidence: {
          overall: 92,
          brand: 95,
          pieceType: 88,
          color: 90,
          material: 85
        },
        rawLabels: [
          { Name: 'Clothing', Confidence: 95.5 },
          { Name: 'Shirt', Confidence: 89.2 },
          { Name: 'Blue', Confidence: 87.3 },
          { Name: 'Cotton', Confidence: 78.5 }
        ],
        detectedText: ['Nike', 'Size M'],
        backgroundRemoved: true,
        processedImageUrl: 'https://s3.amazonaws.com/processed/image.jpg'
      });
    });

    it('should process uploaded image through complete AI pipeline', async () => {
      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('fake-image-data'), 'nike-shirt.jpg')
        .expect(200);

      // Verify response structure
      expect(response.body).toEqual({
        message: 'Image processed successfully',
        analysis: {
          domain: 'APPAREL',
          detectedBrand: 'Nike®',
          detectedPieceType: 'Shirts',
          detectedColor: 'Blue',
          detectedMaterial: 'Cotton',
          confidence: {
            overall: 92,
            brand: 95,
            pieceType: 88,
            color: 90,
            material: 85
          },
          rawLabels: [
            { Name: 'Clothing', Confidence: 95.5 },
            { Name: 'Shirt', Confidence: 89.2 },
            { Name: 'Blue', Confidence: 87.3 },
            { Name: 'Cotton', Confidence: 78.5 }
          ],
          detectedText: ['Nike', 'Size M'],
          backgroundRemoved: true,
          processedImageUrl: 'https://s3.amazonaws.com/processed/image.jpg'
        },
        suggestions: {
          vufsData: {
            domain: 'APPAREL',
            brand: 'Nike®',
            pieceType: 'Shirts',
            color: 'Blue',
            material: 'Cotton'
          },
          confidence: {
            overall: 92,
            brand: 95,
            pieceType: 88,
            color: 90,
            material: 85
          },
          needsReview: false
        }
      });
    });

    it('should handle background removal failure gracefully', async () => {
      mockAIProcessingService.processItemImage.mockResolvedValue({
        domain: 'APPAREL',
        detectedBrand: 'Nike®',
        detectedPieceType: 'Shirts',
        detectedColor: 'Blue',
        detectedMaterial: 'Cotton',
        confidence: {
          overall: 85,
          brand: 88,
          pieceType: 91,
          color: 89,
          material: 75
        },
        rawLabels: [
          { Name: 'Clothing', Confidence: 95.5 },
          { Name: 'Shirt', Confidence: 89.2 }
        ],
        detectedText: ['Nike'],
        backgroundRemoved: false,
        processedImageUrl: undefined
      });

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(200);

      expect(response.body.analysis.backgroundRemoved).toBe(false);
      expect(response.body.analysis.processedImageUrl).toBeUndefined();
    });

    it('should process image from URL through complete pipeline', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as Response);

      const imageUrl = 'https://example.com/nike-shirt.jpg';

      const response = await request(app)
        .post('/ai/analyze-url')
        .send({ imageUrl })
        .expect(200);

      expect(mockFetch).toHaveBeenCalledWith(imageUrl);
      expect(response.body.analysis.domain).toBe('APPAREL');
      expect(response.body.analysis.detectedBrand).toBe('Nike®');
    });
  });

  describe('Confidence Scoring Integration', () => {
    it('should calculate accurate confidence scores based on AI results', async () => {
      // High confidence scenario
      mockAIProcessingService.processItemImage.mockResolvedValue({
        domain: 'APPAREL',
        detectedBrand: 'Adidas®',
        detectedPieceType: 'Shirts',
        detectedColor: 'Blue',
        detectedMaterial: 'Cotton',
        confidence: {
          overall: 94,
          brand: 96,
          pieceType: 93,
          color: 91,
          material: 88
        },
        rawLabels: [
          { Name: 'Clothing', Confidence: 98.5 },
          { Name: 'Shirt', Confidence: 95.2 }
        ],
        detectedText: ['Adidas'],
        backgroundRemoved: true,
        processedImageUrl: 'https://s3.amazonaws.com/test.jpg'
      });

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('high-quality-image'), 'adidas-shirt.jpg')
        .expect(200);

      expect(response.body.analysis.confidence).toEqual({
        overall: 94,
        brand: 96,
        pieceType: 93,
        color: 91,
        material: 88
      });
      expect(response.body.suggestions.needsReview).toBe(false);
    });

    it('should indicate review needed for low confidence results', async () => {
      // Low confidence scenario
      mockAIProcessingService.processItemImage.mockResolvedValue({
        domain: null,
        detectedBrand: null,
        detectedPieceType: null,
        detectedColor: null,
        detectedMaterial: null,
        confidence: {
          overall: 45,
          brand: 0,
          pieceType: 0,
          color: 0,
          material: 0
        },
        rawLabels: [
          { Name: 'Object', Confidence: 65.5 }
        ],
        detectedText: [],
        backgroundRemoved: true,
        processedImageUrl: 'https://s3.amazonaws.com/test.jpg'
      });

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('low-quality-image'), 'unclear-item.jpg')
        .expect(200);

      expect(response.body.analysis.confidence.overall).toBe(45);
      expect(response.body.suggestions.needsReview).toBe(true);
    });
  });

  describe('Background Removal and Enhancement', () => {
    it('should successfully remove background and enhance image', async () => {
      const originalBuffer = Buffer.from('original-image');
      const processedBuffer = Buffer.from('processed-image-no-background');
      
      mockAWSService.removeBackground.mockResolvedValue(processedBuffer);
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/enhanced/image.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 95.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        confidence: 0.85
      });

      const response = await request(app)
        .post('/ai/process')
        .attach('image', originalBuffer, 'test-image.jpg')
        .expect(200);
      
      expect(response.body.analysis.backgroundRemoved).toBe(true);
      expect(response.body.analysis.processedImageUrl).toBe('https://s3.amazonaws.com/enhanced/image.jpg');
    });

    it('should handle background removal service unavailability', async () => {
      mockAWSService.removeBackground.mockRejectedValue(new Error('Service unavailable'));
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 85.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue(null);

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('original-image'), 'test-image.jpg')
        .expect(200);

      expect(response.body.analysis.backgroundRemoved).toBe(false);
      expect(response.body.analysis.processedImageUrl).toBeUndefined();
      
      // Should still detect domain using original image
      expect(response.body.analysis.domain).toBe('APPAREL');
    });
  });

  describe('Batch Processing Integration', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as Response);
    });

    it('should process multiple images with consistent results', async () => {
      // Setup different results for different images
      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      
      // First image: Nike shirt
      mockAWSService.detectLabels
        .mockResolvedValueOnce([
          { Name: 'Clothing', Confidence: 95.5 },
          { Name: 'Shirt', Confidence: 89.2 }
        ])
        .mockResolvedValueOnce([
          { Name: 'Shoe', Confidence: 92.1 },
          { Name: 'Sneaker', Confidence: 88.3 }
        ]);

      mockAWSService.detectText
        .mockResolvedValueOnce([
          { Type: 'LINE', DetectedText: 'Nike', Confidence: 92.1 }
        ])
        .mockResolvedValueOnce([
          { Type: 'LINE', DetectedText: 'Adidas', Confidence: 90.5 }
        ]);

      mockAWSService.invokeFashionModel
        .mockResolvedValueOnce({
          domain: 'APPAREL',
          brand: 'Nike®',
          pieceType: 'Shirts',
          confidence: 0.88
        })
        .mockResolvedValueOnce({
          domain: 'FOOTWEAR',
          brand: 'Adidas®',
          pieceType: 'Sneakers',
          confidence: 0.91
        });

      const imageUrls = [
        'https://example.com/nike-shirt.jpg',
        'https://example.com/adidas-sneakers.jpg'
      ];

      const response = await request(app)
        .post('/ai/batch-process')
        .send({ imageUrls })
        .expect(200);

      expect(response.body.summary).toEqual({
        total: 2,
        successful: 2,
        failed: 0
      });

      // Verify first image result
      expect(response.body.results[0]).toEqual({
        index: 0,
        imageUrl: 'https://example.com/nike-shirt.jpg',
        success: true,
        analysis: expect.objectContaining({
          domain: 'APPAREL',
          detectedBrand: 'Nike®',
          detectedPieceType: 'Shirts'
        })
      });

      // Verify second image result
      expect(response.body.results[1]).toEqual({
        index: 1,
        imageUrl: 'https://example.com/adidas-sneakers.jpg',
        success: true,
        analysis: expect.objectContaining({
          domain: 'FOOTWEAR',
          detectedBrand: 'Adidas®',
          detectedPieceType: 'Sneakers'
        })
      });
    });

    it('should handle mixed success/failure in batch processing', async () => {
      // First URL succeeds, second fails
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
        } as Response)
        .mockResolvedValueOnce({
          ok: false
        } as Response);

      mockAWSService.removeBackground.mockResolvedValue(Buffer.from('processed'));
      mockAWSService.uploadImage.mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 85.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([]);
      mockAWSService.invokeFashionModel.mockResolvedValue({
        domain: 'APPAREL',
        confidence: 0.80
      });

      const imageUrls = [
        'https://example.com/valid-image.jpg',
        'https://example.com/invalid-image.jpg'
      ];

      const response = await request(app)
        .post('/ai/batch-process')
        .send({ imageUrls })
        .expect(200);

      expect(response.body.summary).toEqual({
        total: 2,
        successful: 1,
        failed: 1
      });

      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(false);
      expect(response.body.results[1].error).toBe('Could not fetch image');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from partial AI service failures', async () => {
      mockAWSService.removeBackground.mockRejectedValue(new Error('Background removal failed'));
      mockAWSService.uploadImage.mockRejectedValue(new Error('Upload failed'));
      mockAWSService.detectLabels.mockResolvedValue([
        { Name: 'Clothing', Confidence: 85.5 }
      ]);
      mockAWSService.detectText.mockResolvedValue([
        { Type: 'LINE', DetectedText: 'Nike', Confidence: 88.1 }
      ]);
      mockAWSService.invokeFashionModel.mockRejectedValue(new Error('Model unavailable'));

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('test-image'), 'test.jpg')
        .expect(200);

      // Should still provide results based on available services
      expect(response.body.analysis.backgroundRemoved).toBe(false);
      expect(response.body.analysis.processedImageUrl).toBeUndefined();
      expect(response.body.analysis.domain).toBe('APPAREL');
      expect(response.body.analysis.detectedBrand).toBe('Nike®');
    });
  });
});