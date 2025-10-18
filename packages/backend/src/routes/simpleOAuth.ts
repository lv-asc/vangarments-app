import { Router } from 'express';
import { SimpleOAuthController } from '../controllers/simpleOAuthController';

const router = Router();

// Google OAuth routes
router.get('/google', SimpleOAuthController.initiateGoogleAuth);
router.get('/google/callback', SimpleOAuthController.handleGoogleCallback);

// Facebook OAuth routes
router.get('/facebook', SimpleOAuthController.initiateFacebookAuth);
router.get('/facebook/callback', SimpleOAuthController.handleFacebookCallback);

// OAuth failure handler
router.get('/failure', SimpleOAuthController.handleOAuthFailure);

export default router;