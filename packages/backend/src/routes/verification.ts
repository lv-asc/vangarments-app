import { Router } from 'express';
import { verificationController } from '../controllers/verificationController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Submit verification request (authenticated users)
router.post(
    '/request',
    AuthUtils.authenticateToken,
    verificationController.submitRequest.bind(verificationController)
);

// Get all verification requests (admin only)
router.get(
    '/requests',
    AuthUtils.authenticateToken,
    verificationController.getRequests.bind(verificationController)
);

// Approve verification request (admin only)
router.put(
    '/requests/:id/approve',
    AuthUtils.authenticateToken,
    verificationController.approveRequest.bind(verificationController)
);

// Reject verification request (admin only)
router.put(
    '/requests/:id/reject',
    AuthUtils.authenticateToken,
    verificationController.rejectRequest.bind(verificationController)
);

export default router;
