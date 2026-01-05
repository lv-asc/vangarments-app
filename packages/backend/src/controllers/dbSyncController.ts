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
     * Push local database to cloud
     */
    async pushToCloud(req: Request, res: Response) {
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            res.write('data: {"status": "starting", "message": "Starting push to cloud..."}\n\n');

            const result = await dbSyncService.pushToCloud();

            res.write(`data: ${JSON.stringify({ status: result.success ? 'complete' : 'error', ...result })}\n\n`);
            res.end();
        } catch (error: any) {
            console.error('[DbSync] Push failed:', error);
            res.write(`data: {"status": "error", "message": "${error.message}"}\n\n`);
            res.end();
        }
    },

    /**
     * Pull cloud database to local
     */
    async pullFromCloud(req: Request, res: Response) {
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            res.write('data: {"status": "starting", "message": "Starting pull from cloud..."}\n\n');

            const result = await dbSyncService.pullFromCloud();

            res.write(`data: ${JSON.stringify({ status: result.success ? 'complete' : 'error', ...result })}\n\n`);
            res.end();
        } catch (error: any) {
            console.error('[DbSync] Pull failed:', error);
            res.write(`data: {"status": "error", "message": "${error.message}"}\n\n`);
            res.end();
        }
    }
};
