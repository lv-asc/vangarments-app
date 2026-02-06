import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';
import https from 'https';


const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'vangarments-storage';
const STORAGE_ROOT = path.join(__dirname, '../../storage');

// Initialize GCS client with credentials from gcp-key.json
const keyFilePath = path.join(__dirname, '../../gcp-key.json');
let storage: Storage;

if (fs.existsSync(keyFilePath)) {
    storage = new Storage({ keyFilename: keyFilePath });
    console.log('📦 GCS Storage Proxy: Using credentials from gcp-key.json');
} else {
    storage = new Storage();
    console.log('📦 GCS Storage Proxy: Using default credentials');
}

const bucket = storage.bucket(GCS_BUCKET_NAME);

/**
 * Middleware to proxy storage requests to Google Cloud Storage
 * when local files are not found.
 */
export const gcsStorageProxy = async (req: Request, res: Response, next: NextFunction) => {
    // req.path already has the /storage prefix stripped by app.use('/storage', ...)
    const relativePath = req.path;
    const localPath = path.join(STORAGE_ROOT, relativePath);

    // Check if local file exists
    if (fs.existsSync(localPath)) {
        return next();
    }

    // Local file doesn't exist, fetch from GCS
    const gcsPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

    console.log(`[GCS Proxy] Local file not found: ${localPath}. Checking GCS: ${GCS_BUCKET_NAME}/${gcsPath}`);


    try {
        const file = bucket.file(gcsPath);
        const [exists] = await file.exists();

        if (!exists) {
            console.log(`[GCS Proxy] File not found in GCS: ${gcsPath}. Serving placeholder.`);
            return servePlaceholder(res, relativePath);
        }

        const [metadata] = await file.getMetadata();

        if (metadata.contentType) {
            res.setHeader('Content-Type', metadata.contentType);
        }
        if (metadata.size) {
            res.setHeader('Content-Length', metadata.size as string);
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000');

        const readStream = file.createReadStream();

        readStream.on('error', (error) => {
            console.error(`[GCS Proxy] Stream error:`, error);
            if (!res.headersSent) {
                servePlaceholder(res, relativePath);
            }
        });

        readStream.pipe(res);

    } catch (error: any) {
        console.error(`[GCS Proxy] Error fetching from GCS:`, error);
        if (!res.headersSent) {
            servePlaceholder(res, relativePath);
        }
    }
};

/**
 * Serve a placeholder image from an external service
 */
const servePlaceholder = (res: Response, relativePath: string) => {
    const filename = path.basename(relativePath);
    const text = encodeURIComponent(filename || 'Vangarments');
    // Using a more neutral placeholder color that doesn't look like a bug
    const placeholderUrl = `https://placehold.co/600x400/f3f4f6/94a3b8?text=${text}`;

    https.get(placeholderUrl, (placeholderResponse) => {
        if (placeholderResponse.statusCode === 200) {
            const contentType = placeholderResponse.headers['content-type'];
            if (contentType) res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            placeholderResponse.pipe(res);
        } else {
            res.status(404).json({
                error: {
                    code: 'PLACEHOLDER_ERROR',
                    message: 'Image not found and placeholder service failed'
                }
            });
        }
    }).on('error', (error) => {
        console.error(`[GCS Proxy] Failed to fetch placeholder:`, error);
        res.status(404).json({
            error: {
                code: 'FILE_NOT_FOUND',
                message: 'File not found and placeholder service unreachable'
            }
        });
    });
};

