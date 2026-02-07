import { Router } from 'express';
import { ConditionModel } from '../models/Condition';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Get all conditions
router.get('/', async (req, res) => {
    try {
        const conditions = await ConditionModel.findAll();
        res.json(conditions);
    } catch (error) {
        console.error('Failed to fetch conditions:', error);
        res.status(500).json({ error: 'Failed to fetch conditions', details: error instanceof Error ? error.message : String(error) });
    }
});

// Create condition
router.post('/', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, rating, group, sortOrder } = req.body;

        if (!name || rating === undefined || !group) {
            return res.status(400).json({ error: 'Name, rating, and group are required' });
        }

        if (rating < 6 || rating > 10) {
            return res.status(400).json({ error: 'Rating must be between 6 and 10' });
        }

        if (group !== 'new' && group !== 'used') {
            return res.status(400).json({ error: 'Group must be either "new" or "used"' });
        }

        const condition = await ConditionModel.create(name, rating, group, sortOrder);
        res.json(condition);
    } catch (error) {
        console.error('Failed to create condition:', error);
        res.status(500).json({ error: 'Failed to create condition' });
    }
});

// Update condition
router.put('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, rating, group, sortOrder } = req.body;

        if (rating !== undefined && (rating < 6 || rating > 10)) {
            return res.status(400).json({ error: 'Rating must be between 6 and 10' });
        }

        if (group !== undefined && group !== 'new' && group !== 'used') {
            return res.status(400).json({ error: 'Group must be either "new" or "used"' });
        }

        const condition = await ConditionModel.update(req.params.id, name, rating, group, sortOrder);
        if (!condition) {
            return res.status(404).json({ error: 'Condition not found' });
        }
        res.json(condition);
    } catch (error) {
        console.error('Failed to update condition:', error);
        res.status(500).json({ error: 'Failed to update condition', details: error instanceof Error ? error.message : String(error) });
    }
});

// Delete condition
router.delete('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const success = await ConditionModel.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Condition not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete condition:', error);
        res.status(500).json({ error: 'Failed to delete condition' });
    }
});

export default router;
