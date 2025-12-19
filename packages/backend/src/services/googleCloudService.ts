import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Storage } from '@google-cloud/storage';
import * as admin from 'firebase-admin';

export class GoogleCloudService {
    private static visionClient = new ImageAnnotatorClient();
    private static storage = new Storage();
    private static bucketName = process.env.GCS_BUCKET_NAME || 'vangarments-storage';

    /**
     * Upload image to Google Cloud Storage
     */
    static async uploadImage(buffer: Buffer, key: string, contentType: string = 'image/jpeg'): Promise<string> {
        const bucket = this.storage.bucket(this.bucketName);
        const file = bucket.file(key);

        await file.save(buffer, {
            metadata: { contentType },
            resumable: false,
        });

        // Generate public URL (assuming public access or configured signed URLs)
        // For Cloud Run, usually we use signed URLs or a CDN fronting the bucket
        return `https://storage.googleapis.com/${this.bucketName}/${key}`;
    }

    /**
     * Detect labels and text using Google Vision AI
     */
    static async analyzeImage(buffer: Buffer) {
        const [labelResult] = await this.visionClient.labelDetection(buffer);
        const labels = labelResult.labelAnnotations || [];

        const [textResult] = await this.visionClient.textDetection(buffer);
        const textDetections = textResult.textAnnotations || [];

        return {
            labels: labels.map(l => ({
                Name: l.description,
                Confidence: (l.score || 0) * 100
            })),
            textDetections: textDetections.map(t => ({
                Type: 'LINE', // Simplified mapping
                DetectedText: t.description,
                Confidence: 100 // Vision API doesn't provide per-line confidence in standard response easily
            }))
        };
    }

    /**
     * Delete image from Google Cloud Storage
     */
    static async deleteImage(key: string): Promise<void> {
        const bucket = this.storage.bucket(this.bucketName);
        const file = bucket.file(key);
        await file.delete();
    }

    /**
     * Initialize Firebase Admin (if not already initialized)
     */
    static initializeFirebase() {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                // databaseURL: process.env.FIREBASE_DATABASE_URL
            });
        }
    }
}
