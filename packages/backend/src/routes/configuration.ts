import { Router } from 'express';
import { ConfigurationController } from '../controllers/configurationController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// All configuration routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Get all configurations
router.get('/', ConfigurationController.getConfigurations);

// VUFS Standards routes
router.get('/vufs-standards', ConfigurationController.getVUFSStandards);
router.put('/vufs-standards', ConfigurationController.updateVUFSStandards);

// Add new VUFS items
router.post('/vufs-standards/categories', ConfigurationController.addVUFSCategory);
router.post('/vufs-standards/brands', ConfigurationController.addVUFSBrand);
router.post('/vufs-standards/colors', ConfigurationController.addVUFSColor);
router.post('/vufs-standards/materials', ConfigurationController.addVUFSMaterial);

// System settings
router.put('/system-settings', ConfigurationController.updateSystemSettings);

// Backup and rollback
router.get('/backups', ConfigurationController.getBackupHistory);
router.post('/rollback/:backupId', ConfigurationController.rollbackConfiguration);
router.post('/reload', ConfigurationController.reloadConfiguration);

export default router;