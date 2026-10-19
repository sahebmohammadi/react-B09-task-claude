import type { Role } from '../constants/roles';
import type { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    'dashboard:read',
    'project:read',
    'project:create',
    'project:update:any',
    'project:delete:any',
    'project:status:any',
    'proposal:read:any',
    'proposal:review:any',
    'user:read',
    'user:manage',
  ],
  owner: [
    'dashboard:read',
    'project:read',
    'project:create',
    'project:update:own',
    'project:delete:own',
    'project:status:own',
    'proposal:read:project',
    'proposal:review:project',
  ],
  freelancer: [
    'dashboard:read',
    'project:read',
    'project:status:assigned',
    'proposal:create',
    'proposal:withdraw:own',
    'proposal:read:own',
  ],
};
