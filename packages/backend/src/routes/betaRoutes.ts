import { Router } from 'express';
import { BetaProgramController } from '../controllers/betaProgramController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All beta routes require authentication
router.use(authenticateToken);

// Beta program management
router.post('/join', BetaProgramController.joinBetaProgram);
router.get('/status', BetaProgramController.getBetaStatus);
router.get('/analytics', BetaProgramController.getBetaAnalytics);

// Feedback system
router.post('/feedback', BetaProgramController.submitFeedback);
router.get('/feedback', BetaProgramController.getFeedbackHistory);

// Exclusive content and features
router.get('/exclusive-content', BetaProgramController.getExclusiveContent);
router.get('/leaderboard', BetaProgramController.getBetaLeaderboard);
router.get('/network-visibility', BetaProgramController.getNetworkVisibility);

// Referral system
router.get('/referral/:referralCode/validate', BetaProgramController.validateReferralCode);

// Admin/Industry leader routes
router.get('/stats', BetaProgramController.getBetaStats);

export default router;