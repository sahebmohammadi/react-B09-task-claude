import { SidebarTrigger } from '@/components/ui/sidebar';

export function Topbar() {
  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
    </header>
  );
}
