import { AWSService } from '../../src/services/awsService';

const mockS3 = {
  upload: jest.fn(),
  deleteObject: jest.fn(),
  getSignedUrl: jest.fn()
};

const mockRekognition = {
  detectLabels: jest.fn(),
  detectText: jest.fn()
};

const mockSageMaker = {
  invokeEndpoint: jest.fn()
};

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  config: {
    update: jest.fn()
  },
  S3: jest.fn(() => mockS3),
  Rekognition: jest.fn(() => mockRekognition),
  SageMakerRuntime: jest.fn(() => mockSageMaker)
}));

describe('AWSService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should successfully upload image to S3', async () => {
      const mockLocation = 'https://s3.amazonaws.com/bucket/test-image.jpg';
      mockS3.upload.mockReturnValue({
        promise: () => Promise.resolve({ Location: mockLocation })
      });

      const buffer = Buffer.from('test-image-data');
      const key = 'test-images/image.jpg';
      const contentType = 'image/jpeg';

      const result = await AWSService.uploadImage(buffer, key, contentType);

      expect(result).toBe(mockLocation);
      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: 'vangarments-images-dev',
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
      });
    });

    it('should use default content type when not provided', async () => {
      const mockLocation = 'https://s3.amazonaws.com/bucket/test-image.jpg';
      mockS3.upload.mockReturnValue({
        promise: () => Promise.resolve({ Location: mockLocation })
      });

      const buffer = Buffer.from('test-image-data');
      const key = 'test-images/image.jpg';

      await AWSService.uploadImage(buffer, key);

      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: 'vangarments-images-dev',
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      });
    });

    it('should use custom bucket from environment variable', async () => {
      const originalBucket = process.env.AWS_S3_BUCKET;
      process.env.AWS_S3_BUCKET = 'custom-bucket';

      const mockLocation = 'https://s3.amazonaws.com/custom-bucket/test-image.jpg';
      mockS3.upload.mockReturnValue({
        promise: () => Promise.resolve({ Location: mockLocation })
      });

      const buffer = Buffer.from('test-image-data');
      const key = 'test-images/image.jpg';

      await AWSService.uploadImage(buffer, key);

      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: 'custom-bucket',
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      });

      process.env.AWS_S3_BUCKET = originalBucket;
    });

    it('should handle S3 upload errors', async () => {
      const uploadError = new Error('S3 upload failed');
      mockS3.upload.mockReturnValue({
        promise: () => Promise.reject(uploadError)
      });

      const buffer = Buffer.from('test-image-data');
      const key = 'test-images/image.jpg';

      await expect(AWSService.uploadImage(buffer, key)).rejects.toThrow('S3 upload failed');
    });
  });

  describe('removeBackground', () => {
    it('should return original image buffer as placeholder implementation', async () => {
      const originalBuffer = Buffer.from('test-image-data');
      
      const result = await AWSService.removeBackground(originalBuffer);
      
      expect(result).toBe(originalBuffer);
    });

    it('should log background removal request', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalBuffer = Buffer.from('test-image-data');
      
      await AWSService.removeBackground(originalBuffer);
      
      expect(consoleSpy).toHaveBeenCalledWith('Background removal requested - using placeholder implementation');
      
      consoleSpy.mockRestore();
    });
  });

  describe('detectLabels', () => {
    it('should successfully detect labels in image', async () => {
      const mockLabels = [
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 },
        { Name: 'Blue', Confidence: 87.3 }
      ];

      mockRekognition.detectLabels.mockReturnValue({
        promise: () => Promise.resolve({ Labels: mockLabels })
      });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.detectLabels(imageBuffer);

      expect(result).toEqual(mockLabels);
      expect(mockRekognition.detectLabels).toHaveBeenCalledWith({
        Image: {
          Bytes: imageBuffer
        },
        MaxLabels: 20,
        MinConfidence: 70
      });
    });

    it('should return empty array when no labels detected', async () => {
      mockRekognition.detectLabels.mockReturnValue({
        promise: () => Promise.resolve({ Labels: undefined })
      });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.detectLabels(imageBuffer);

      expect(result).toEqual([]);
    });

    it('should handle Rekognition errors', async () => {
      const rekognitionError = new Error('Rekognition service error');
      mockRekognition.detectLabels.mockReturnValue({
        promise: () => Promise.reject(rekognitionError)
      });

      const imageBuffer = Buffer.from('test-image-data');

      await expect(AWSService.detectLabels(imageBuffer)).rejects.toThrow('Rekognition service error');
    });

    it('should use correct confidence threshold and max labels', async () => {
      mockRekognition.detectLabels.mockReturnValue({
        promise: () => Promise.resolve({ Labels: [] })
      });

      const imageBuffer = Buffer.from('test-image-data');
      await AWSService.detectLabels(imageBuffer);

      expect(mockRekognition.detectLabels).toHaveBeenCalledWith({
        Image: {
          Bytes: imageBuffer
        },
        MaxLabels: 20,
        MinConfidence: 70
      });
    });
  });

  describe('detectText', () => {
    it('should successfully detect text in image', async () => {
      const mockTextDetections = [
        { Type: 'LINE', DetectedText: 'Nike', Confidence: 92.1 },
        { Type: 'WORD', DetectedText: 'Nike', Confidence: 92.1 },
        { Type: 'LINE', DetectedText: 'Size M', Confidence: 88.5 }
      ];

      mockRekognition.detectText.mockReturnValue({
        promise: () => Promise.resolve({ TextDetections: mockTextDetections })
      });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.detectText(imageBuffer);

      expect(result).toEqual(mockTextDetections);
      expect(mockRekognition.detectText).toHaveBeenCalledWith({
        Image: {
          Bytes: imageBuffer
        }
      });
    });

    it('should return empty array when no text detected', async () => {
      mockRekognition.detectText.mockReturnValue({
        promise: () => Promise.resolve({ TextDetections: undefined })
      });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.detectText(imageBuffer);

      expect(result).toEqual([]);
    });

    it('should handle text detection errors', async () => {
      const textDetectionError = new Error('Text detection failed');
      mockRekognition.detectText.mockReturnValue({
        promise: () => Promise.reject(textDetectionError)
      });

      const imageBuffer = Buffer.from('test-image-data');

      await expect(AWSService.detectText(imageBuffer)).rejects.toThrow('Text detection failed');
    });
  });

  describe('invokeFashionModel', () => {
    it('should successfully invoke custom fashion model', async () => {
      const mockModelResponse = {
        domain: 'APPAREL',
        brand: 'Nike®',
        pieceType: 'Shirts',
        color: 'Blue',
        material: 'Cotton',
        confidence: 0.92
      };

      mockSageMaker.invokeEndpoint.mockReturnValue({
        promise: () => Promise.resolve({
          Body: Buffer.from(JSON.stringify(mockModelResponse))
        })
      });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.invokeFashionModel(imageBuffer);

      expect(result).toEqual(mockModelResponse);
      expect(mockSageMaker.invokeEndpoint).toHaveBeenCalledWith({
        EndpointName: 'vangarments-fashion-classifier',
        ContentType: 'image/jpeg',
        Body: imageBuffer
      });
    });

    it('should use custom endpoint name when provided', async () => {
      const mockModelResponse = { confidence: 0.85 };
      mockSageMaker.invokeEndpoint.mockReturnValue({
        promise: () => Promise.resolve({
          Body: Buffer.from(JSON.stringify(mockModelResponse))
        })
      });

      const imageBuffer = Buffer.from('test-image-data');
      const customEndpoint = 'custom-fashion-model';
      
      await AWSService.invokeFashionModel(imageBuffer, customEndpoint);

      expect(mockSageMaker.invokeEndpoint).toHaveBeenCalledWith({
        EndpointName: customEndpoint,
        ContentType: 'image/jpeg',
        Body: imageBuffer
      });
    });

    it('should return null when model response has no body', async () => {
      mockSageMaker.invokeEndpoint.mockReturnValue({
        promise: () => Promise.resolve({ Body: undefined })
      });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.invokeFashionModel(imageBuffer);

      expect(result).toBeNull();
    });

    it('should handle model invocation errors gracefully', async () => {
      const modelError = new Error('Model endpoint not found');
      mockSageMaker.invokeEndpoint.mockReturnValue({
        promise: () => Promise.reject(modelError)
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.invokeFashionModel(imageBuffer);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Custom fashion model not available, using fallback detection');
      
      consoleSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      mockSageMaker.invokeEndpoint.mockReturnValue({
        promise: () => Promise.resolve({
          Body: Buffer.from('invalid-json')
        })
      });

      const imageBuffer = Buffer.from('test-image-data');
      
      const result = await AWSService.invokeFashionModel(imageBuffer);
      expect(result).toBeNull();
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL with default parameters', () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=abc123';
      mockS3.getSignedUrl.mockReturnValue(mockUrl);

      const key = 'test-images/image.jpg';
      const result = AWSService.generatePresignedUrl(key);

      expect(result).toBe(mockUrl);
      expect(mockS3.getSignedUrl).toHaveBeenCalledWith('putObject', {
        Bucket: process.env.AWS_S3_BUCKET || 'vangarments-images-dev',
        Key: key,
        Expires: 3600,
        ContentType: 'image/jpeg'
      });
    });

    it('should generate presigned URL with custom expiration', () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=abc123';
      mockS3.getSignedUrl.mockReturnValue(mockUrl);

      const key = 'test-images/image.jpg';
      const expiresIn = 7200;
      const result = AWSService.generatePresignedUrl(key, expiresIn);

      expect(result).toBe(mockUrl);
      expect(mockS3.getSignedUrl).toHaveBeenCalledWith('putObject', {
        Bucket: process.env.AWS_S3_BUCKET || 'vangarments-images-dev',
        Key: key,
        Expires: expiresIn,
        ContentType: 'image/jpeg'
      });
    });

    it('should use custom bucket from environment variable', () => {
      const originalBucket = process.env.AWS_S3_BUCKET;
      process.env.AWS_S3_BUCKET = 'custom-bucket';

      const mockUrl = 'https://s3.amazonaws.com/custom-bucket/key?signature=abc123';
      mockS3.getSignedUrl.mockReturnValue(mockUrl);

      const key = 'test-images/image.jpg';
      AWSService.generatePresignedUrl(key);

      expect(mockS3.getSignedUrl).toHaveBeenCalledWith('putObject', {
        Bucket: 'custom-bucket',
        Key: key,
        Expires: 3600,
        ContentType: 'image/jpeg'
      });

      process.env.AWS_S3_BUCKET = originalBucket;
    });
  });

  describe('deleteImage', () => {
    it('should successfully delete image from S3', async () => {
      mockS3.deleteObject.mockReturnValue({
        promise: () => Promise.resolve({})
      });

      const key = 'test-images/image.jpg';
      await AWSService.deleteImage(key);

      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: process.env.AWS_S3_BUCKET || 'vangarments-images-dev',
        Key: key
      });
    });

    it('should use custom bucket from environment variable', async () => {
      const originalBucket = process.env.AWS_S3_BUCKET;
      process.env.AWS_S3_BUCKET = 'custom-bucket';

      mockS3.deleteObject.mockReturnValue({
        promise: () => Promise.resolve({})
      });

      const key = 'test-images/image.jpg';
      await AWSService.deleteImage(key);

      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: 'custom-bucket',
        Key: key
      });

      process.env.AWS_S3_BUCKET = originalBucket;
    });

    it('should handle S3 delete errors', async () => {
      const deleteError = new Error('S3 delete failed');
      mockS3.deleteObject.mockReturnValue({
        promise: () => Promise.reject(deleteError)
      });

      const key = 'test-images/image.jpg';

      await expect(AWSService.deleteImage(key)).rejects.toThrow('S3 delete failed');
    });
  });

  describe('AWS Configuration', () => {
    it('should configure AWS SDK correctly', () => {
      // This test verifies that AWS SDK is properly imported and configured
      expect(AWS.S3).toBeDefined();
      expect(AWS.Rekognition).toBeDefined();
      expect(AWS.SageMakerRuntime).toBeDefined();
    });

    it('should handle environment configuration', () => {
      // Test that the service can handle different environment configurations
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      // The service should work regardless of environment
      expect(() => {
        const buffer = Buffer.from('test');
        AWSService.removeBackground(buffer);
      }).not.toThrow();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});