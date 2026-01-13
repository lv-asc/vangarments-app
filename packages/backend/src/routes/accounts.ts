import { Router } from 'express';
import { AccountController } from '../controllers/accountController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all accounts the current user can switch to
router.get('/switchable', authenticateToken, AccountController.getSwitchableAccounts);

export default router;
