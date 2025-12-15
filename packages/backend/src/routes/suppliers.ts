import { Router } from 'express';
import * as supplierController from '../controllers/supplierController';

const router = Router();

router.get('/', supplierController.getAllSuppliers);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

export default router;
