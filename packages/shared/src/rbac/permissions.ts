export const PERMISSIONS = [
  'dashboard:read',
  'project:read',
  'project:create',
  'project:update:own',
  'project:update:any',
  'project:delete:own',
  'project:delete:any',
  'project:status:own',
  'project:status:assigned',
  'project:status:any',
  'proposal:create',
  'proposal:withdraw:own',
  'proposal:read:own',
  'proposal:read:project',
  'proposal:read:any',
  'proposal:review:project',
  'proposal:review:any',
  'user:read',
  'user:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
