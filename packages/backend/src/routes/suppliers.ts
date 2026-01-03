import { Router } from 'express';
import * as supplierController from '../controllers/supplierController';
import { getTaggedContentForSupplier } from '../controllers/tagController';

const router = Router();

router.get('/', supplierController.getAllSuppliers);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

// Tagged content endpoint
router.get('/:supplierId/tagged', getTaggedContentForSupplier);

export default router;
