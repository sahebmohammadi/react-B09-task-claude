export interface HealthStatus {
  status: 'ok' | 'error';
  db: 'up' | 'down';
}
