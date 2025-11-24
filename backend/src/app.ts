// backend/src/app.ts
import './config/dotenv'; // Must be the first import
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// --- Middlewares ---

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Simple request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


// --- API Routes ---
// All API routes are prefixed with /api
app.use('/api', apiRoutes);


// --- Error Handling ---
// This should be the last middleware
app.use(errorHandler);

export default app;
