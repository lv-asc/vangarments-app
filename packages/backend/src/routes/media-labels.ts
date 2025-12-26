import { Router } from 'express';
import { MediaLabelModel } from '../models/MediaLabel';
import { AuthUtils } from '../utils/auth';

const router = Router();

// --- Media Labels ---

router.get('/', async (req, res) => {
    try {
        const labels = await MediaLabelModel.findAll();
        res.json(labels);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch media labels' });
    }
});

router.post('/', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, groupIds } = req.body;
        const label = await MediaLabelModel.create(name, groupIds);
        res.json(label);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create media label' });
    }
});

router.put('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, groupIds } = req.body;
        const label = await MediaLabelModel.update(req.params.id, name, groupIds);
        if (!label) return res.status(404).json({ error: 'Media label not found' });
        res.json(label);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update media label' });
    }
});

router.delete('/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const success = await MediaLabelModel.delete(req.params.id);
        if (!success) return res.status(404).json({ error: 'Media label not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete media label' });
    }
});

// --- Groups ---

router.get('/groups/all', async (req, res) => {
    try {
        const groups = await MediaLabelModel.findAllGroups();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch media label groups' });
    }
});

router.post('/groups', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, representativeColor } = req.body;
        const group = await MediaLabelModel.createGroup(name, representativeColor);
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

router.put('/groups/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const { name, representativeColor, labelIds } = req.body;
        const group = await MediaLabelModel.updateGroup(req.params.id, name, representativeColor, labelIds);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update group' });
    }
});

router.delete('/groups/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), async (req, res) => {
    try {
        const success = await MediaLabelModel.deleteGroup(req.params.id);
        if (!success) return res.status(404).json({ error: 'Group not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

export default router;
