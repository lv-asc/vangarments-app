import { Router } from 'express';
import { SizeModel } from '../models/Size';
import { AuthUtils } from '../utils/auth';

const router = Router();

// --- Sizes ---

router.get('/', async (req, res) => {
    try {
        const sizes = await SizeModel.findAll();
        res.json(sizes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sizes' });
    }
});

router.post('/', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, sortOrder, conversions, validCategoryIds } = req.body;
        const size = await SizeModel.create(name, sortOrder, conversions, validCategoryIds);
        res.json(size);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create size' });
    }
});

router.put('/reorder', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { orders } = req.body;
        console.log('[Sizes Route] Received reorder request:', JSON.stringify(orders));
        if (!Array.isArray(orders)) {
            console.warn('[Sizes Route] Reorder failed: orders is not an array');
            return res.status(400).json({ error: 'Orders must be an array' });
        }
        await SizeModel.updateOrder(orders);
        console.log('[Sizes Route] Reorder successful');
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Sizes Route] Reorder error:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to reorder sizes', details: error.message });
    }
});

router.put('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, sortOrder, conversions, validCategoryIds } = req.body;
        const size = await SizeModel.update(req.params.id, name, sortOrder, conversions, validCategoryIds);
        if (!size) return res.status(404).json({ error: 'Size not found' });
        res.json(size);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update size' });
    }
});

router.delete('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const success = await SizeModel.delete(req.params.id);
        if (!success) return res.status(404).json({ error: 'Size not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete size' });
    }
});

export default router;
