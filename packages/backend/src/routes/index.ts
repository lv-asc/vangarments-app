import { Router } from 'express';
import authRoutes from './auth';
import simpleOAuthRoutes from './simpleOAuth';
import userRoutes from './users';
import vufsRoutes from './vufs';
import wardrobeRoutes from './wardrobe';
import anteroomRoutes from './anteroom';
import trackingRoutes from './tracking';
import aiRoutes from './ai';
import outfitRoutes from './outfits';
import photographyRoutes from './photography';
import marketplaceRoutes from './marketplace';
import advertisingRoutes from './advertising';
import subscriptionRoutes from './subscriptions';
import dataDrivenRoutes from './dataDriven';
import freemiumRoutes from './freemium';
import upgradeRoutes from './upgrade';
import lgpdRoutes from './lgpd';
import betaRoutes from './betaRoutes';
import socialRoutes from './social';
import securityRoutes from './security';
import { contentDiscoveryRoutes } from './contentDiscovery';
import { contentModerationRoutes } from './contentModeration';
import monitoringRoutes from './monitoringRoutes';
import storageRoutes from './storage';
import vufsManagementRoutes from './vufsManagement';
import configurationRoutes from './configuration';

const router = Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/oauth', simpleOAuthRoutes);
router.use('/users', userRoutes);
router.use('/vufs', vufsRoutes);
router.use('/wardrobe', wardrobeRoutes);
router.use('/anteroom', anteroomRoutes);
router.use('/tracking', trackingRoutes);
router.use('/ai', aiRoutes);
router.use('/outfits', outfitRoutes);
router.use('/photography', photographyRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/advertising', advertisingRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/data-driven', dataDrivenRoutes);
router.use('/freemium', freemiumRoutes);
router.use('/upgrade', upgradeRoutes);
router.use('/lgpd', lgpdRoutes);
router.use('/beta', betaRoutes);
router.use('/social', socialRoutes);
router.use('/security', securityRoutes);
router.use('/content-discovery', contentDiscoveryRoutes);
router.use('/content-moderation', contentModerationRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/storage', storageRoutes);
router.use('/vufs-management', vufsManagementRoutes);
router.use('/configuration', configurationRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});

export default router;