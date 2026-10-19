import type { Role } from '../constants/roles';
import type { Permission } from './permissions';
import { ROLE_PERMISSIONS } from './role-permissions';

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** True when the role has at least one of the permissions (used by route guards). */
export function hasAnyPermission(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
