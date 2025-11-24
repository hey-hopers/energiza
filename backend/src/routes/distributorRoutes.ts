import { Router } from 'express';
import * as distributorController from '../controllers/distributorController';

const router = Router();

router.get('/', distributorController.getAllDistributors);
router.get('/:id', distributorController.getDistributorById);

export default router;