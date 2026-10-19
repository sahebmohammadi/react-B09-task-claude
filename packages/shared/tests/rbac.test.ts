import { describe, expect, it } from 'vitest';
import { ROLES } from '../src/constants/roles';
import { hasAnyPermission, hasPermission } from '../src/rbac/has-permission';
import { PERMISSIONS } from '../src/rbac/permissions';
import { ROLE_PERMISSIONS } from '../src/rbac/role-permissions';

describe('ROLE_PERMISSIONS', () => {
  it.each(ROLES)('%s references only defined permissions', (role) => {
    const defined: readonly string[] = PERMISSIONS;
    for (const permission of ROLE_PERMISSIONS[role]) {
      expect(defined).toContain(permission);
    }
  });

  it.each(ROLES)('%s has no duplicate permissions', (role) => {
    const permissions = ROLE_PERMISSIONS[role];
    expect(new Set(permissions).size).toBe(permissions.length);
  });
});

describe('hasPermission', () => {
  it('grants a permission the role has', () => {
    expect(hasPermission('owner', 'project:create')).toBe(true);
  });

  it('denies a permission the role lacks', () => {
    expect(hasPermission('freelancer', 'project:create')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('passes when the role has one of the permissions', () => {
    expect(hasAnyPermission('admin', ['project:update:own', 'project:update:any'])).toBe(true);
  });

  it('fails when the role has none of the permissions', () => {
    expect(hasAnyPermission('freelancer', ['user:read', 'user:manage'])).toBe(false);
  });
});
