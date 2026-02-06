import { Router } from 'express';
import { HomiesController } from '../controllers/homiesController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Get current user's lists
router.get('/my', AuthUtils.authenticateToken, HomiesController.getMyLists);

// Search candidates for homies list
router.get('/candidates', AuthUtils.authenticateToken, HomiesController.searchCandidates);

// Create a new list
router.post('/', AuthUtils.authenticateToken, HomiesController.createList);

// Update a list
router.put('/:id', AuthUtils.authenticateToken, HomiesController.updateList);

// Delete a list
router.delete('/:id', AuthUtils.authenticateToken, HomiesController.deleteList);

// Get members of a list
router.get('/:id/members', AuthUtils.authenticateToken, HomiesController.getListMembers);

// Add member to a list
router.post('/:id/members/:memberId', AuthUtils.authenticateToken, HomiesController.addMember);

// Remove member from a list
router.delete('/:id/members/:memberId', AuthUtils.authenticateToken, HomiesController.removeMember);

// Check if current user is in target user's lists (viewing profile)
router.get('/user/:userId', AuthUtils.authenticateToken, HomiesController.getTargetUserLists);

export default router;
