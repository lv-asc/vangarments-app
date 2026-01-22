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

import socialRoutes from './social';
import securityRoutes from './security';
import { contentDiscoveryRoutes } from './contentDiscovery';
import { contentModerationRoutes } from './contentModeration';
import monitoringRoutes from './monitoringRoutes';
import storageRoutes from './storage';
import vufsManagementRoutes from './vufsManagement';
import configurationRoutes from './configuration';
import adminRoutes from './admin';

import brandRoutes from './brand';

import skuRoutes from './sku';
import colorRoutes from './colors';
import mediaLabelRoutes from './media-labels';
import conditionRoutes from './conditions';
import sizeRoutes from './sizes';
import journalismRoutes from './journalismRoutes';
import pageRoutes from './pageRoutes';
import storeRoutes from './stores';
import supplierRoutes from './suppliers';
import messagesRoutes from './messages';
import designFileRoutes from './designFileRoutes';
import moodboardRoutes from './moodboardRoutes';
import mockupRoutes from './mockupRoutes';
import verificationRoutes from './verification';
import notificationRoutes from './notifications';
import pomRoutes from './pom';
import tagRoutes from './tags';
import calendarRoutes from './calendarRoutes';
import accountRoutes from './accounts';
import likesRoutes from './likes';
import wishlistRoutes from './wishlists';
import silhouetteRoutes from './silhouettes';
import googleCalendarRoutes from './googleCalendarRoutes';

const router = Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/oauth', simpleOAuthRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/vufs', vufsRoutes);
router.use('/brands', brandRoutes);
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
router.use('/skus', skuRoutes); // New SKU routes

router.use('/social', socialRoutes);
router.use('/security', securityRoutes);
router.use('/content-discovery', contentDiscoveryRoutes);
router.use('/content-moderation', contentModerationRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/storage', storageRoutes);
router.use('/vufs-management', vufsManagementRoutes);
router.use('/configuration', configurationRoutes);
router.use('/colors', colorRoutes); // New Color routes
router.use('/media-labels', mediaLabelRoutes); // Media labels for SKU images/videos
router.use('/conditions', conditionRoutes); // Wardrobe item conditions
router.use('/sizes', sizeRoutes); // New Size routes
router.use('/journalism', journalismRoutes); // New Journalism routes
router.use('/pages', pageRoutes);
router.use('/stores', storeRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/messages', messagesRoutes); // Direct messaging routes
router.use('/design-files', designFileRoutes); // Phase 1: Creative & Design
router.use('/moodboards', moodboardRoutes); // Phase 1: Moodboard system
router.use('/mockups', mockupRoutes); // Phase 1: Mockup templates
router.use('/verification', verificationRoutes); // Verification system
router.use('/notifications', notificationRoutes); // Notification system
router.use('/pom', pomRoutes); // Point of Measurement system
router.use('/tags', tagRoutes); // Media tagging system
router.use('/calendar', calendarRoutes); // Calendar events system
router.use('/accounts', accountRoutes); // Account switching system
router.use('/likes', likesRoutes); // User likes system
router.use('/wishlists', wishlistRoutes); // User wishlist system
router.use('/silhouettes', silhouetteRoutes); // Brand silhouettes system
router.use('/google-calendar', googleCalendarRoutes); // Google Calendar integration

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;