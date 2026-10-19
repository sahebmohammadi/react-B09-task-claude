import type { ApiResponse, HealthStatus } from '@freelancehub/shared';
import { api } from '@/lib/api';

export async function getHealth(): Promise<HealthStatus> {
  const res = await api.get<ApiResponse<HealthStatus>>('/health', {
    // A 503 still carries the health body (db: "down"), so it is not treated as a failure.
    validateStatus: (status) => status === 200 || status === 503,
  });
  return res.data.data;
}
