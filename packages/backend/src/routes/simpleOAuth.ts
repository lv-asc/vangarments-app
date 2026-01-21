import { Router } from 'express';
import { SimpleOAuthController } from '../controllers/simpleOAuthController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Google OAuth routes
router.get('/google', SimpleOAuthController.initiateGoogleAuth); // Legacy/General
router.get('/google/login', SimpleOAuthController.initiateGoogleAuth);
router.get('/google/signup', SimpleOAuthController.initiateGoogleAuth);
router.get('/google/callback', SimpleOAuthController.handleGoogleCallback);
router.get('/google/connect', SimpleOAuthController.initiateGoogleConnect);
router.get('/google/connect/callback', SimpleOAuthController.handleGoogleConnectCallback);

// Facebook OAuth routes
router.get('/facebook', SimpleOAuthController.initiateFacebookAuth); // Legacy/General
router.get('/facebook/login', SimpleOAuthController.initiateFacebookAuth);
router.get('/facebook/signup', SimpleOAuthController.initiateFacebookAuth);
router.get('/facebook/callback', SimpleOAuthController.handleFacebookCallback);
router.get('/facebook/connect', SimpleOAuthController.initiateFacebookConnect);
router.get('/facebook/connect/callback', SimpleOAuthController.handleFacebookConnectCallback);

// General OAuth management
router.delete('/:provider', AuthUtils.authenticateToken, SimpleOAuthController.disconnectOAuth);

// OAuth failure handler
router.get('/failure', SimpleOAuthController.handleOAuthFailure);

export default router;