import { Router } from 'express';
import { VUFSManagementController } from '../controllers/vufsManagementController';

const router = Router();

// Category routes
router.get('/categories', VUFSManagementController.getCategories);
router.get('/categories/search', VUFSManagementController.searchCategories);
router.get('/categories/:id/path', VUFSManagementController.getCategoryPath);
router.post('/categories/build-hierarchy', VUFSManagementController.buildCategoryHierarchy);

// Brand routes
router.get('/brands', VUFSManagementController.getBrands);
router.get('/brands/search', VUFSManagementController.searchBrands);
router.get('/brands/:id/path', VUFSManagementController.getBrandPath);
router.post('/brands/build-hierarchy', VUFSManagementController.buildBrandHierarchy);

// Color routes
router.get('/colors', VUFSManagementController.getColors);

// Material routes
router.get('/materials', VUFSManagementController.getMaterials);
router.get('/materials/search', VUFSManagementController.searchMaterials);

// Care instruction routes
router.get('/care-instructions', VUFSManagementController.getCareInstructions);

// Metadata building helper
router.post('/metadata/build', VUFSManagementController.buildItemMetadata);

export default router;