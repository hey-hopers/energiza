// backend/src/routes/peopleRoutes.ts
import { Router } from 'express';
import * as peopleController from '../controllers/peopleController';
import { validate } from '../middlewares/validationMiddleware';
import { createPersonSchema, updatePersonSchema } from '../validators/peopleValidator';

const router = Router();

router.get('/', peopleController.getAllPeople);
router.get('/:id', peopleController.getPersonById);
router.post('/', validate(createPersonSchema), peopleController.createPerson);
router.put('/:id', validate(updatePersonSchema), peopleController.updatePerson);
router.delete('/:id', peopleController.deletePerson);

export default router;
