import { Router } from 'express';
import * as storeController from '../controllers/storeController';

const router = Router();

router.get('/', storeController.getAllStores);
router.post('/', storeController.createStore);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

export default router;
