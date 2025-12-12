import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// For local development with LocalStack
if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT_URL) {
  AWS.config.update({
    // @ts-ignore
    endpoint: process.env.AWS_ENDPOINT_URL,
    s3ForcePathStyle: true,
  });
}

export const s3 = new AWS.S3();
export const rekognition = new AWS.Rekognition();
export const sageMaker = new AWS.SageMakerRuntime();

export class AWSService {
  /**
   * Upload image to S3
   */
  static async uploadImage(
    buffer: Buffer,
    key: string,
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    const bucketName = process.env.AWS_S3_BUCKET || 'vangarments-images-dev';

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  }

  /**
   * Remove background from image using AWS Rekognition
   */
  static async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    // Note: AWS Rekognition doesn't have built-in background removal
    // This would typically use a third-party service or custom ML model
    // For now, we'll return the original image
    // In production, you'd integrate with services like Remove.bg API

    console.log('Background removal requested - using placeholder implementation');
    return imageBuffer;
  }

  /**
   * Detect objects and labels in image using AWS Rekognition
   */
  static async detectLabels(imageBuffer: Buffer): Promise<AWS.Rekognition.Label[]> {
    const params = {
      Image: {
        Bytes: imageBuffer,
      },
      MaxLabels: 20,
      MinConfidence: 70,
    };

    const result = await rekognition.detectLabels(params).promise();
    return result.Labels || [];
  }

  /**
   * Detect text in image (for brand/size detection)
   */
  static async detectText(imageBuffer: Buffer): Promise<AWS.Rekognition.TextDetection[]> {
    const params = {
      Image: {
        Bytes: imageBuffer,
      },
    };

    const result = await rekognition.detectText(params).promise();
    return result.TextDetections || [];
  }

  /**
   * Custom fashion recognition using SageMaker endpoint
   */
  static async invokeFashionModel(
    imageBuffer: Buffer,
    endpointName: string = 'vangarments-fashion-classifier'
  ): Promise<any> {
    try {
      const params = {
        EndpointName: endpointName,
        ContentType: 'image/jpeg',
        Body: imageBuffer,
      };

      const result = await sageMaker.invokeEndpoint(params).promise();

      if (result.Body) {
        return JSON.parse(result.Body.toString());
      }

      return null;
    } catch (error) {
      console.log('Custom fashion model not available, using fallback detection');
      return null;
    }
  }

  /**
   * Generate presigned URL for image upload
   */
  static generatePresignedUrl(key: string, expiresIn: number = 3600): string {
    const bucketName = process.env.AWS_S3_BUCKET || 'vangarments-images-dev';

    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn,
      ContentType: 'image/jpeg',
    };

    return s3.getSignedUrl('putObject', params);
  }

  /**
   * Delete image from S3
   */
  static async deleteImage(key: string): Promise<void> {
    const bucketName = process.env.AWS_S3_BUCKET || 'vangarments-images-dev';

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    await s3.deleteObject(params).promise();
  }
}