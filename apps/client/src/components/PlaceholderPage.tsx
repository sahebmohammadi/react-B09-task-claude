interface PlaceholderPageProps {
  title: string;
}

/** Stands in for pages that later phases build. */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">This page is coming in a later phase.</p>
    </div>
  );
}
