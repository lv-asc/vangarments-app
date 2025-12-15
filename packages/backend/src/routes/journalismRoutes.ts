import express from 'express';
import {
    getAllJournalism,
    getJournalismById,
    createJournalism,
    updateJournalism,
    deleteJournalism
} from '../controllers/journalismController';
// import { protect, admin } from '../middleware/authMiddleware'; // Assuming auth middleware exists

const router = express.Router();

// Public routes for reading (maybe?) - for now let's keep all open or protect later
router.get('/', getAllJournalism);
router.get('/:id', getJournalismById);

// Protected Admin routes (add middleware later if needed, based on existing pattern)
router.post('/', createJournalism);
router.put('/:id', updateJournalism);
router.delete('/:id', deleteJournalism);

export default router;
