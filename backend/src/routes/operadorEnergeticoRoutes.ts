import { Router } from 'express';
import * as operadorController from '../controllers/operadorEnergeticoController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { operadorEnergeticoSchema } from '../validators/operadorEnergeticoValidator';

const router = Router();

router.get('/me', authenticate, operadorController.getMyOperador);
router.post('/', authenticate, validate(operadorEnergeticoSchema), operadorController.createOrUpdateOperador);

export default router;