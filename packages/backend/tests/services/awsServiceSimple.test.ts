// Mock AWS SDK before importing
jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnValue({
      promise: jest.fn()
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn()
    }),
    getSignedUrl: jest.fn()
  };

  const mockRekognitionInstance = {
    detectLabels: jest.fn().mockReturnValue({
      promise: jest.fn()
    }),
    detectText: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  };

  const mockSageMakerInstance = {
    invokeEndpoint: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  };

  return {
    config: {
      update: jest.fn()
    },
    S3: jest.fn(() => mockS3Instance),
    Rekognition: jest.fn(() => mockRekognitionInstance),
    SageMakerRuntime: jest.fn(() => mockSageMakerInstance)
  };
});

import { AWSService } from '../../src/services/awsService';

describe('AWSService - Background Removal and Enhancement', () => {
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

  describe('uploadImage', () => {
    it('should successfully upload image to S3', async () => {
      const AWS = require('aws-sdk');
      const mockS3 = new AWS.S3();
      const mockLocation = 'https://s3.amazonaws.com/bucket/test-image.jpg';
      
      mockS3.upload().promise.mockResolvedValue({ Location: mockLocation });

      const buffer = Buffer.from('test-image-data');
      const key = 'test-images/image.jpg';
      const contentType = 'image/jpeg';

      const result = await AWSService.uploadImage(buffer, key, contentType);

      expect(result).toBe(mockLocation);
      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: process.env.AWS_S3_BUCKET || 'vangarments-images-dev',
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
      });
    });

    it('should handle S3 upload errors', async () => {
      const AWS = require('aws-sdk');
      const mockS3 = new AWS.S3();
      const uploadError = new Error('S3 upload failed');
      
      mockS3.upload().promise.mockRejectedValue(uploadError);

      const buffer = Buffer.from('test-image-data');
      const key = 'test-images/image.jpg';

      await expect(AWSService.uploadImage(buffer, key)).rejects.toThrow('S3 upload failed');
    });
  });

  describe('detectLabels', () => {
    it('should successfully detect labels in image', async () => {
      const AWS = require('aws-sdk');
      const mockRekognition = new AWS.Rekognition();
      const mockLabels = [
        { Name: 'Clothing', Confidence: 95.5 },
        { Name: 'Shirt', Confidence: 89.2 },
        { Name: 'Blue', Confidence: 87.3 }
      ];

      mockRekognition.detectLabels().promise.mockResolvedValue({ Labels: mockLabels });

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
      const AWS = require('aws-sdk');
      const mockRekognition = new AWS.Rekognition();
      
      mockRekognition.detectLabels().promise.mockResolvedValue({ Labels: undefined });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.detectLabels(imageBuffer);

      expect(result).toEqual([]);
    });

    it('should handle Rekognition errors', async () => {
      const AWS = require('aws-sdk');
      const mockRekognition = new AWS.Rekognition();
      const rekognitionError = new Error('Rekognition service error');
      
      mockRekognition.detectLabels().promise.mockRejectedValue(rekognitionError);

      const imageBuffer = Buffer.from('test-image-data');

      await expect(AWSService.detectLabels(imageBuffer)).rejects.toThrow('Rekognition service error');
    });
  });

  describe('detectText', () => {
    it('should successfully detect text in image', async () => {
      const AWS = require('aws-sdk');
      const mockRekognition = new AWS.Rekognition();
      const mockTextDetections = [
        { Type: 'LINE', DetectedText: 'Nike', Confidence: 92.1 },
        { Type: 'WORD', DetectedText: 'Nike', Confidence: 92.1 },
        { Type: 'LINE', DetectedText: 'Size M', Confidence: 88.5 }
      ];

      mockRekognition.detectText().promise.mockResolvedValue({ TextDetections: mockTextDetections });

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
      const AWS = require('aws-sdk');
      const mockRekognition = new AWS.Rekognition();
      
      mockRekognition.detectText().promise.mockResolvedValue({ TextDetections: undefined });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.detectText(imageBuffer);

      expect(result).toEqual([]);
    });
  });

  describe('invokeFashionModel', () => {
    it('should successfully invoke custom fashion model', async () => {
      const AWS = require('aws-sdk');
      const mockSageMaker = new AWS.SageMakerRuntime();
      const mockModelResponse = {
        domain: 'APPAREL',
        brand: 'Nike®',
        pieceType: 'Shirts',
        color: 'Blue',
        material: 'Cotton',
        confidence: 0.92
      };

      mockSageMaker.invokeEndpoint().promise.mockResolvedValue({
        Body: Buffer.from(JSON.stringify(mockModelResponse))
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

    it('should return null when model response has no body', async () => {
      const AWS = require('aws-sdk');
      const mockSageMaker = new AWS.SageMakerRuntime();
      
      mockSageMaker.invokeEndpoint().promise.mockResolvedValue({ Body: undefined });

      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.invokeFashionModel(imageBuffer);

      expect(result).toBeNull();
    });

    it('should handle model invocation errors gracefully', async () => {
      const AWS = require('aws-sdk');
      const mockSageMaker = new AWS.SageMakerRuntime();
      const modelError = new Error('Model endpoint not found');
      
      mockSageMaker.invokeEndpoint().promise.mockRejectedValue(modelError);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const imageBuffer = Buffer.from('test-image-data');
      const result = await AWSService.invokeFashionModel(imageBuffer);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Custom fashion model not available, using fallback detection');
      
      consoleSpy.mockRestore();
    });
  });
});