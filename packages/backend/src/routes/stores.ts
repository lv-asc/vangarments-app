import { Router } from 'express';
import * as storeController from '../controllers/storeController';
import { getTaggedContentForStore } from '../controllers/tagController';

const router = Router();

router.get('/', storeController.getAllStores);
router.post('/', storeController.createStore);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

// Tagged content endpoint
router.get('/:storeId/tagged', getTaggedContentForStore);

export default router;
