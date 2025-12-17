import { Router } from 'express';
import { ColorModel } from '../models/Color';
import { AuthUtils } from '../utils/auth';

const router = Router();

// --- Colors ---

router.get('/', async (req, res) => {
    try {
        const colors = await ColorModel.findAll();
        res.json(colors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch colors' });
    }
});

router.post('/', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, hexCode, groupIds } = req.body;
        const color = await ColorModel.create(name, hexCode, groupIds);
        res.json(color);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create color' });
    }
});

router.put('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, hexCode, groupIds } = req.body;
        const color = await ColorModel.update(req.params.id, name, hexCode, groupIds);
        if (!color) return res.status(404).json({ error: 'Color not found' });
        res.json(color);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update color' });
    }
});

router.delete('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const success = await ColorModel.delete(req.params.id);
        if (!success) return res.status(404).json({ error: 'Color not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete color' });
    }
});

// --- Groups ---

router.get('/groups/all', async (req, res) => {
    try {
        const groups = await ColorModel.findAllGroups();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch color groups' });
    }
});

router.post('/groups', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, representativeColor } = req.body;
        const group = await ColorModel.createGroup(name, representativeColor);
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

router.put('/groups/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, representativeColor, colorIds } = req.body;
        const group = await ColorModel.updateGroup(req.params.id, name, representativeColor, colorIds);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update group' });
    }
});

router.delete('/groups/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const success = await ColorModel.deleteGroup(req.params.id);
        if (!success) return res.status(404).json({ error: 'Group not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

export default router;
