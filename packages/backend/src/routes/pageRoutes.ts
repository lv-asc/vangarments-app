import { Router } from 'express';
import * as pageController from '../controllers/pageController';

const router = Router();

router.get('/', pageController.getAllPages);
router.get('/:id', pageController.getPage);
router.post('/', pageController.createPage);
router.put('/:id', pageController.updatePage);
router.delete('/:id', pageController.deletePage);

// Team Routes
router.get('/:id/team', pageController.getTeamMembers);
router.post('/:id/team', pageController.addTeamMember);
router.put('/:id/team/:memberId', pageController.updateTeamMember);
router.delete('/:id/team/:memberId', pageController.removeTeamMember);

export default router;
