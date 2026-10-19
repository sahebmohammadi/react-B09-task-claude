import type { HealthStatus } from '@freelancehub/shared';
import { isDbConnected } from '../../config/db';

export function getHealth(): HealthStatus {
  return isDbConnected() ? { status: 'ok', db: 'up' } : { status: 'error', db: 'down' };
}
