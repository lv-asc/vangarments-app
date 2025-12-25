import { Router } from 'express';
import { VUFSManagementController } from '../controllers/vufsManagementController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Category routes
// router.get('/categories', VUFSManagementController.getCategories); // Removed duplicate unprotected route
router.post(
    '/categories',
    AuthUtils.authenticateToken,
    AuthUtils.requireRole(['admin']),
    VUFSManagementController.addCategory
);
router.patch(
    '/categories/:id',
    AuthUtils.authenticateToken,
    AuthUtils.requireRole(['admin']),
    VUFSManagementController.updateCategory
);
router.get('/categories', VUFSManagementController.getCategories);
router.delete('/categories/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteCategory);
router.get('/categories/search', VUFSManagementController.searchCategories);
router.get('/categories/:id/path', VUFSManagementController.getCategoryPath);
router.post('/categories/build-hierarchy', VUFSManagementController.buildCategoryHierarchy);

// Category Trash routes
router.get('/categories/trash', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.getDeletedCategories);
router.post('/categories/:id/restore', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.restoreCategory);
router.delete('/categories/:id/permanent', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.permanentlyDeleteCategory);

// Brand routes

router.get('/brands', VUFSManagementController.getBrands);
router.post('/brands', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addBrand);
router.patch('/brands/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateBrand);
router.delete('/brands/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteBrand);
router.get('/brands/search', VUFSManagementController.searchBrands);
router.get('/brands/:id/path', VUFSManagementController.getBrandPath);
router.post('/brands/build-hierarchy', VUFSManagementController.buildBrandHierarchy);

// Color routes
router.get('/colors', VUFSManagementController.getColors);
router.post('/colors', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addColor);
router.patch('/colors/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateColor);
router.delete('/colors/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteColor);

// Material routes
router.get('/materials', VUFSManagementController.getMaterials);
router.post('/materials', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addMaterial);
router.patch('/materials/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateMaterial);
router.delete('/materials/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteMaterial);
router.get('/materials/search', VUFSManagementController.searchMaterials);

// Pattern routes
router.get('/patterns', VUFSManagementController.getPatterns);
router.post('/patterns', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addPattern);
router.patch('/patterns/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updatePattern);
router.delete('/patterns/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deletePattern);

// Fit routes
router.get('/fits', VUFSManagementController.getFits);
router.post('/fits', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addFit);
router.patch('/fits/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateFit);
router.delete('/fits/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteFit);

// Gender routes
router.get('/genders', VUFSManagementController.getGenders);
router.post('/genders', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addGender);
router.patch('/genders/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateGender);
router.delete('/genders/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteGender);

// Size routes
router.get('/sizes', VUFSManagementController.getSizes);
router.post('/sizes', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addSize);
router.patch('/sizes/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateSize);
router.delete('/sizes/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteSize);

// Standards routes
router.get('/standards', VUFSManagementController.getStandards);
router.post('/standards', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addStandard);
router.patch('/standards/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateStandard);
router.delete('/standards/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteStandard);

// Care instruction routes
router.get('/care-instructions', VUFSManagementController.getCareInstructions);

// Metadata building helper
router.post('/metadata/build', VUFSManagementController.buildItemMetadata);

// Bulk operations
// Bulk operations
router.post('/bulk', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.bulkAdd);

// --- DYNAMIC ATTRIBUTE MANAGEMENT ---
router.get('/attributes', VUFSManagementController.getAttributeTypes);
router.post('/attributes', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addAttributeType);
router.patch('/attributes/:slug', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateAttributeType);
router.delete('/attributes/:slug', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteAttributeType);

router.get('/attributes/:typeSlug/values', VUFSManagementController.getAttributeValues);
router.post('/attributes/:typeSlug/values', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.addAttributeValue);
router.patch('/attributes/values/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateAttributeValue);
router.delete('/attributes/values/:id', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.deleteAttributeValue);
router.get('/attributes/values/:id/descendants', VUFSManagementController.getAttributeValueDescendants);
router.put('/attributes/values/reorder', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.reorderAttributeValues);
router.put('/attributes/values/:id/hierarchy', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.changeHierarchyLevel);

// --- MATRIX VIEW ---

router.get('/matrix', VUFSManagementController.getAllCategoryAttributes);
router.post('/matrix', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.setCategoryAttribute);

router.get('/matrix/brands', VUFSManagementController.getAllBrandAttributes);
router.post('/matrix/brands', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.setBrandAttribute);

router.get('/matrix/sizes', VUFSManagementController.getAllSizeAttributes);
router.post('/matrix/sizes', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.setSizeAttribute);

// --- GLOBAL SETTINGS ---
router.get('/settings', VUFSManagementController.getSettings);
router.post('/settings', AuthUtils.authenticateToken, AuthUtils.requireRole(['admin']), VUFSManagementController.updateSettings);

export default router;