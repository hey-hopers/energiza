import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { loginSchema, registerSchema } from '../validators/authValidator';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

export default router;