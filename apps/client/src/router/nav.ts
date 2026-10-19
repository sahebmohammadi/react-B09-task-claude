import type { Permission } from '@freelancehub/shared';
import { FileText, FolderKanban, LayoutDashboard, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard', permission: 'dashboard:read' },
  {
    label: 'Projects',
    icon: FolderKanban,
    path: '/dashboard/projects',
    permission: 'project:read',
  },
  {
    label: 'My proposals',
    icon: FileText,
    path: '/dashboard/proposals',
    permission: 'proposal:read:own',
  },
  { label: 'Users', icon: Users, path: '/dashboard/users', permission: 'user:read' },
];
