import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useHealth } from './hooks';

export function HealthCard() {
  const { data, isPending, isError } = useHealth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>API health</CardTitle>
        <CardDescription>Live status from GET /api/health</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-5 w-40" />
        ) : isError ? (
          <StatusLine ok={false} label="API unreachable" />
        ) : (
          <div className="space-y-2">
            <StatusLine ok={data.status === 'ok'} label={`API: ${data.status}`} />
            <StatusLine ok={data.db === 'up'} label={`Database: ${data.db}`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusLineProps {
  ok: boolean;
  label: string;
}

function StatusLine({ ok, label }: StatusLineProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={cn('size-2.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-red-500')}
      />
      <span>{label}</span>
    </div>
  );
}
