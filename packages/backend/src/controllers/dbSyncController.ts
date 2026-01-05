import { Request, Response } from 'express';
import { dbSyncService } from '../services/dbSyncService';

export const dbSyncController = {
    /**
     * Get current database status
     */
    async getStatus(req: Request, res: Response) {
        try {
            const status = await dbSyncService.getStatus();
            res.json(status);
        } catch (error: any) {
            console.error('[DbSync] Failed to get status:', error);
            res.status(500).json({ error: { code: 'SYNC_ERROR', message: error.message } });
        }
    },

    /**
     * Switch database mode
     */
    async switchMode(req: Request, res: Response) {
        try {
            const { mode } = req.body;

            if (!mode || !['local', 'cloud'].includes(mode)) {
                return res.status(400).json({ error: { code: 'INVALID_MODE', message: 'Mode must be "local" or "cloud"' } });
            }

            const result = await dbSyncService.switchMode(mode);
            res.json(result);
        } catch (error: any) {
            console.error('[DbSync] Failed to switch mode:', error);
            res.status(500).json({ error: { code: 'SYNC_ERROR', message: error.message } });
        }
    },

    /**
     * Push local database to cloud (with SSE progress)
     */
    async pushToCloud(req: Request, res: Response) {
        console.log('[DbSync] === Push to Cloud Request Received ===');

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const sendProgress = (step: number, totalSteps: number, description: string, details?: string) => {
            const percent = Math.round((step / totalSteps) * 100);
            const data = JSON.stringify({ step, totalSteps, percent, description, details });
            res.write(`data: ${data}\n\n`);
        };

        try {
            sendProgress(0, 4, 'Initializing sync...', 'Preparing to dump local database');

            const result = await dbSyncService.pushToCloud((step, total, desc, details) => {
                sendProgress(step, total, desc, details);
            });

            if (result.success) {
                sendProgress(4, 4, 'Complete!', result.message);
                res.write(`data: ${JSON.stringify({ status: 'complete', ...result })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ status: 'error', ...result })}\n\n`);
            }
        } catch (error: any) {
            console.error('[DbSync] Push failed with exception:', error);
            res.write(`data: ${JSON.stringify({ status: 'error', message: error.message })}\n\n`);
        } finally {
            res.end();
        }
    },

    /**
     * Pull cloud database to local (with SSE progress)
     */
    async pullFromCloud(req: Request, res: Response) {
        console.log('[DbSync] === Pull from Cloud Request Received ===');

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const sendProgress = (step: number, totalSteps: number, description: string, details?: string) => {
            const percent = Math.round((step / totalSteps) * 100);
            const data = JSON.stringify({ step, totalSteps, percent, description, details });
            res.write(`data: ${data}\n\n`);
        };

        try {
            sendProgress(0, 4, 'Initializing sync...', 'Preparing to pull from cloud');

            const result = await dbSyncService.pullFromCloud((step, total, desc, details) => {
                sendProgress(step, total, desc, details);
            });

            if (result.success) {
                sendProgress(4, 4, 'Complete!', result.message);
                res.write(`data: ${JSON.stringify({ status: 'complete', ...result })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ status: 'error', ...result })}\n\n`);
            }
        } catch (error: any) {
            console.error('[DbSync] Pull failed with exception:', error);
            res.write(`data: ${JSON.stringify({ status: 'error', message: error.message })}\n\n`);
        } finally {
            res.end();
        }
    }
};
