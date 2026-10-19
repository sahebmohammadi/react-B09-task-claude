import { HealthCard } from '@/features/health/HealthCard';

export function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">Role-based stats arrive in a later phase.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HealthCard />
      </div>
    </div>
  );
}
