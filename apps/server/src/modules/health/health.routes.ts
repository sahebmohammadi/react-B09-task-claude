import { Router } from 'express';
import * as healthController from './health.controller';

// Public: used by the dashboard health card and uptime checks.
export const healthRouter = Router();

healthRouter.get('/', healthController.getHealth);
