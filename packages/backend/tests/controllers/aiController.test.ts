import request from 'supertest';
import express from 'express';
import { AIController, uploadMiddleware } from '../../src/controllers/aiController';
import { AIProcessingService } from '../../src/services/aiProcessingService';
import { AuthenticatedRequest } from '../../src/utils/auth';

// Mock AI Processing Service
jest.mock('../../src/services/aiProcessingService');
const mockAIProcessingService = AIProcessingService as jest.Mocked<typeof AIProcessingService>;

// Mock fetch for URL analysis
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AIController', () => {
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
    app.get('/ai/capabilities', AIController.getCapabilities);
    app.post('/ai/batch-process', AIController.batchProcess);

    jest.clearAllMocks();
  });

  describe('POST /ai/process', () => {
    const mockAnalysisResult = {
      domain: 'APPAREL' as const,
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
      backgroundRemoved: true,
      processedImageUrl: 'https://s3.amazonaws.com/processed/test-image.jpg'
    };

    beforeEach(() => {
      mockAIProcessingService.processItemImage.mockResolvedValue(mockAnalysisResult);
    });

    it('should successfully process uploaded image', async () => {
      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Image processed successfully',
        analysis: mockAnalysisResult,
        suggestions: {
          vufsData: {
            domain: 'APPAREL',
            brand: 'Nike®',
            pieceType: 'Shirts',
            color: 'Blue',
            material: 'Cotton'
          },
          confidence: mockAnalysisResult.confidence,
          needsReview: false // confidence.overall >= 80
        }
      });

      expect(mockAIProcessingService.processItemImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        'test-image.jpg'
      );
    });

    it('should indicate review needed for low confidence results', async () => {
      const lowConfidenceResult = {
        ...mockAnalysisResult,
        confidence: {
          ...mockAnalysisResult.confidence,
          overall: 65
        }
      };
      mockAIProcessingService.processItemImage.mockResolvedValue(lowConfidenceResult);

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(200);

      expect(response.body.suggestions.needsReview).toBe(true);
    });

    it('should return 400 when no image is provided', async () => {
      const response = await request(app)
        .post('/ai/process')
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'NO_IMAGE',
          message: 'Image file is required'
        }
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Create app without authentication
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.post('/ai/process', uploadMiddleware, AIController.processImage);

      const response = await request(unauthApp)
        .post('/ai/process')
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(401);

      expect(response.body).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    });

    it('should handle processing errors gracefully', async () => {
      mockAIProcessingService.processItemImage.mockRejectedValue(
        new Error('Processing failed')
      );

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: 'PROCESSING_ERROR',
          message: 'An error occurred while processing the image'
        }
      });
    });

    it('should handle invalid file type errors', async () => {
      mockAIProcessingService.processItemImage.mockRejectedValue(
        new Error('Only image files are allowed')
      );

      const response = await request(app)
        .post('/ai/process')
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only image files are allowed'
        }
      });
    });
  });

  describe('POST /ai/analyze-url', () => {
    const mockAnalysisResult = {
      domain: 'FOOTWEAR' as const,
      detectedBrand: 'Adidas®',
      detectedPieceType: 'Sneakers',
      detectedColor: 'White',
      detectedMaterial: 'Leather',
      confidence: {
        overall: 92,
        brand: 95,
        pieceType: 88,
        color: 90,
        material: 85
      },
      rawLabels: [
        { Name: 'Shoe', Confidence: 95.5 },
        { Name: 'Sneaker', Confidence: 89.2 }
      ],
      detectedText: ['Adidas'],
      backgroundRemoved: true,
      processedImageUrl: 'https://s3.amazonaws.com/processed/url-image.jpg'
    };

    beforeEach(() => {
      mockAIProcessingService.processItemImage.mockResolvedValue(mockAnalysisResult);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as Response);
    });

    it('should successfully analyze image from URL', async () => {
      const imageUrl = 'https://example.com/test-image.jpg';

      const response = await request(app)
        .post('/ai/analyze-url')
        .send({ imageUrl })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Image analyzed successfully',
        analysis: mockAnalysisResult,
        suggestions: {
          vufsData: {
            domain: 'FOOTWEAR',
            brand: 'Adidas®',
            pieceType: 'Sneakers',
            color: 'White',
            material: 'Leather'
          },
          confidence: mockAnalysisResult.confidence,
          needsReview: false
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(imageUrl);
      expect(mockAIProcessingService.processItemImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        'test-image.jpg'
      );
    });

    it('should return 400 when no URL is provided', async () => {
      const response = await request(app)
        .post('/ai/analyze-url')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'MISSING_URL',
          message: 'Image URL is required'
        }
      });
    });

    it('should return 400 when URL is invalid', async () => {
      mockFetch.mockResolvedValue({
        ok: false
      } as Response);

      const response = await request(app)
        .post('/ai/analyze-url')
        .send({ imageUrl: 'https://invalid-url.com/image.jpg' })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'INVALID_URL',
          message: 'Could not fetch image from URL'
        }
      });
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/ai/analyze-url')
        .send({ imageUrl: 'https://example.com/image.jpg' })
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'An error occurred while analyzing the image'
        }
      });
    });

    it('should use default filename when URL has no filename', async () => {
      const imageUrl = 'https://example.com/';

      await request(app)
        .post('/ai/analyze-url')
        .send({ imageUrl })
        .expect(200);

      expect(mockAIProcessingService.processItemImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        'image.jpg'
      );
    });
  });

  describe('GET /ai/capabilities', () => {
    it('should return AI processing capabilities', async () => {
      const response = await request(app)
        .get('/ai/capabilities')
        .expect(200);

      expect(response.body).toEqual({
        capabilities: {
          backgroundRemoval: true,
          brandDetection: true,
          pieceTypeDetection: true,
          colorDetection: true,
          materialDetection: true,
          textRecognition: true,
          customModelSupport: true
        },
        supportedDomains: ['APPAREL', 'FOOTWEAR'],
        supportedBrands: ['Adidas®', 'Nike®', 'Zara®', 'H&M', 'Uniqlo®'],
        supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSize: '10MB',
        processingTime: 'Typically 3-10 seconds',
        confidenceThreshold: 70
      });
    });

    it('should handle capabilities errors gracefully', async () => {
      // Mock console.error to simulate an error
      const originalError = console.error;
      console.error = jest.fn(() => {
        throw new Error('Capabilities error');
      });

      const response = await request(app)
        .get('/ai/capabilities')
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching capabilities'
        }
      });

      console.error = originalError;
    });
  });

  describe('POST /ai/batch-process', () => {
    const mockAnalysisResult = {
      domain: 'APPAREL' as const,
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
      rawLabels: [],
      detectedText: [],
      backgroundRemoved: true
    };

    beforeEach(() => {
      mockAIProcessingService.processItemImage.mockResolvedValue(mockAnalysisResult);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as Response);
    });

    it('should successfully process batch of images', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ];

      const response = await request(app)
        .post('/ai/batch-process')
        .send({ imageUrls })
        .expect(200);

      expect(response.body.message).toBe('Batch processing completed: 2/2 images processed successfully');
      expect(response.body.results).toHaveLength(2);
      expect(response.body.summary).toEqual({
        total: 2,
        successful: 2,
        failed: 0
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockAIProcessingService.processItemImage).toHaveBeenCalledTimes(2);
    });

    it('should return 401 when user is not authenticated', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.post('/ai/batch-process', AIController.batchProcess);

      const response = await request(unauthApp)
        .post('/ai/batch-process')
        .send({ imageUrls: ['https://example.com/image.jpg'] })
        .expect(401);

      expect(response.body).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    });

    it('should return 400 when no image URLs provided', async () => {
      const response = await request(app)
        .post('/ai/batch-process')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'INVALID_INPUT',
          message: 'Array of image URLs is required'
        }
      });
    });

    it('should return 400 when too many images provided', async () => {
      const imageUrls = Array(11).fill('https://example.com/image.jpg');

      const response = await request(app)
        .post('/ai/batch-process')
        .send({ imageUrls })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'TOO_MANY_IMAGES',
          message: 'Maximum 10 images allowed per batch'
        }
      });
    });

    it('should handle partial failures in batch processing', async () => {
      const imageUrls = [
        'https://example.com/valid-image.jpg',
        'https://example.com/invalid-image.jpg'
      ];

      // Mock first fetch to succeed, second to fail
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
        } as Response)
        .mockResolvedValueOnce({
          ok: false
        } as Response);

      const response = await request(app)
        .post('/ai/batch-process')
        .send({ imageUrls })
        .expect(200);

      expect(response.body.message).toBe('Batch processing completed: 1/2 images processed successfully');
      expect(response.body.summary).toEqual({
        total: 2,
        successful: 1,
        failed: 1
      });

      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(false);
      expect(response.body.results[1].error).toBe('Could not fetch image');
    });

    it('should handle processing errors in batch', async () => {
      const imageUrls = ['https://example.com/image.jpg'];

      mockAIProcessingService.processItemImage.mockRejectedValue(
        new Error('Processing failed')
      );

      const response = await request(app)
        .post('/ai/batch-process')
        .send({ imageUrls })
        .expect(200);

      expect(response.body.summary).toEqual({
        total: 1,
        successful: 0,
        failed: 1
      });

      expect(response.body.results[0].success).toBe(false);
      expect(response.body.results[0].error).toBe('Processing failed');
    });

    it('should handle batch processing errors gracefully', async () => {
      // Simulate an error in the batch processing logic itself
      mockFetch.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/ai/batch-process')
        .send({ imageUrls: ['https://example.com/image.jpg'] })
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: 'BATCH_PROCESSING_ERROR',
          message: 'An error occurred during batch processing'
        }
      });
    });
  });
});