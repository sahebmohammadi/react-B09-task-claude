import type { ApiResponse, HealthStatus } from '@freelancehub/shared';
import type { RequestHandler } from 'express';
import * as healthService from './health.service';

export const getHealth: RequestHandler = (_req, res) => {
  const health = healthService.getHealth();
  const body: ApiResponse<HealthStatus> = { data: health };
  res.status(health.db === 'up' ? 200 : 503).json(body);
};
