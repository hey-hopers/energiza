import { Router } from 'express';
import * as consumptionUnitController from '../controllers/consumptionUnitController';
import { validate } from '../middlewares/validationMiddleware';
import { createConsumptionUnitSchema, updateConsumptionUnitSchema } from '../validators/consumptionUnitValidator';

const router = Router();

router.get('/', consumptionUnitController.getAllConsumptionUnits);
router.get('/:id', consumptionUnitController.getConsumptionUnitById);
router.post('/', validate(createConsumptionUnitSchema), consumptionUnitController.createConsumptionUnit);
router.put('/:id', validate(updateConsumptionUnitSchema), consumptionUnitController.updateConsumptionUnit);
router.delete('/:id', consumptionUnitController.deleteConsumptionUnit);

export default router;