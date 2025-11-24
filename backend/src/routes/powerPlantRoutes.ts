import { Router } from 'express';
import * as powerPlantController from '../controllers/powerPlantController';
import { validate } from '../middlewares/validationMiddleware';
import { createPowerPlantSchema, updatePowerPlantSchema } from '../validators/powerPlantValidator';

const router = Router();

router.get('/', powerPlantController.getAllPowerPlants);
router.get('/:id', powerPlantController.getPowerPlantById);
router.post('/', validate(createPowerPlantSchema), powerPlantController.createPowerPlant);
router.put('/:id', validate(updatePowerPlantSchema), powerPlantController.updatePowerPlant);
router.delete('/:id', powerPlantController.deletePowerPlant);

export default router;