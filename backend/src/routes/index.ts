// backend/src/routes/index.ts
import { Router } from 'express';
import peopleRoutes from './peopleRoutes';
import authRoutes from './authRoutes';
import operadorEnergeticoRoutes from './operadorEnergeticoRoutes';
import consumptionUnitRoutes from './consumptionUnitRoutes';
import distributorRoutes from './distributorRoutes';
import powerPlantRoutes from './powerPlantRoutes';

const router = Router();

// All routes will be prefixed with /api
router.use('/auth', authRoutes);
router.use('/people', peopleRoutes);
router.use('/operador-energetico', operadorEnergeticoRoutes);
router.use('/consumption-units', consumptionUnitRoutes);
router.use('/distributors', distributorRoutes);
router.use('/power-plants', powerPlantRoutes);

// Simple health check route
router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

export default router;
