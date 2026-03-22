import { describe, it, expect } from 'vitest';
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission, hasAnyPermission } from '@/lib/permissions';

describe('PERMISSIONS', () => {
  it('defines all expected permission constants', () => {
    expect(PERMISSIONS.MEDIA_VIEW).toBe('media:view');
    expect(PERMISSIONS.MEDIA_APPROVE).toBe('media:approve');
    expect(PERMISSIONS.MEDIA_REJECT).toBe('media:reject');
    expect(PERMISSIONS.MEDIA_FEATURE).toBe('media:feature');
    expect(PERMISSIONS.MEDIA_REMOVE).toBe('media:remove');
    expect(PERMISSIONS.MEDIA_BULK_ACTION).toBe('media:bulk');
    expect(PERMISSIONS.USERS_VIEW).toBe('users:view');
    expect(PERMISSIONS.USERS_BAN).toBe('users:ban');
    expect(PERMISSIONS.USERS_VERIFY).toBe('users:verify');
    expect(PERMISSIONS.USERS_MANAGE_ROLES).toBe('users:manage_roles');
    expect(PERMISSIONS.REPORTS_VIEW).toBe('reports:view');
    expect(PERMISSIONS.REPORTS_RESOLVE).toBe('reports:resolve');
    expect(PERMISSIONS.CHALLENGES_MANAGE).toBe('challenges:manage');
    expect(PERMISSIONS.TAXONOMY_MANAGE).toBe('taxonomy:manage');
    expect(PERMISSIONS.CMS_MANAGE).toBe('cms:manage');
    expect(PERMISSIONS.ANALYTICS_VIEW).toBe('analytics:view');
    expect(PERMISSIONS.AUDIT_VIEW).toBe('audit:view');
    expect(PERMISSIONS.SETTINGS_MANAGE).toBe('settings:manage');
    expect(PERMISSIONS.LEADERBOARD_MANAGE).toBe('leaderboard:manage');
  });

  it('has 19 total permission constants', () => {
    expect(Object.keys(PERMISSIONS)).toHaveLength(19);
  });
});

describe('ROLE_PERMISSIONS', () => {
  it('super_admin has all permissions', () => {
    const allPermissions = Object.values(PERMISSIONS);
    expect(ROLE_PERMISSIONS.super_admin).toEqual(expect.arrayContaining(allPermissions));
    expect(ROLE_PERMISSIONS.super_admin).toHaveLength(allPermissions.length);
  });

  it('content_moderator has media and report permissions', () => {
    const modPerms = ROLE_PERMISSIONS.content_moderator;
    expect(modPerms).toContain(PERMISSIONS.MEDIA_VIEW);
    expect(modPerms).toContain(PERMISSIONS.MEDIA_APPROVE);
    expect(modPerms).toContain(PERMISSIONS.MEDIA_REJECT);
    expect(modPerms).toContain(PERMISSIONS.MEDIA_FEATURE);
    expect(modPerms).toContain(PERMISSIONS.REPORTS_VIEW);
    expect(modPerms).toContain(PERMISSIONS.REPORTS_RESOLVE);
  });

  it('content_moderator does not have user management permissions', () => {
    const modPerms = ROLE_PERMISSIONS.content_moderator;
    expect(modPerms).not.toContain(PERMISSIONS.USERS_BAN);
    expect(modPerms).not.toContain(PERMISSIONS.USERS_MANAGE_ROLES);
    expect(modPerms).not.toContain(PERMISSIONS.SETTINGS_MANAGE);
  });

  it('curator has media view, feature, cms, and taxonomy permissions', () => {
    const curatorPerms = ROLE_PERMISSIONS.curator;
    expect(curatorPerms).toContain(PERMISSIONS.MEDIA_VIEW);
    expect(curatorPerms).toContain(PERMISSIONS.MEDIA_FEATURE);
    expect(curatorPerms).toContain(PERMISSIONS.CMS_MANAGE);
    expect(curatorPerms).toContain(PERMISSIONS.TAXONOMY_MANAGE);
    expect(curatorPerms).not.toContain(PERMISSIONS.MEDIA_APPROVE);
  });

  it('developer has analytics and audit read-only permissions', () => {
    const devPerms = ROLE_PERMISSIONS.developer;
    expect(devPerms).toContain(PERMISSIONS.ANALYTICS_VIEW);
    expect(devPerms).toContain(PERMISSIONS.AUDIT_VIEW);
    expect(devPerms).toHaveLength(2);
  });

  it('support_agent has user view and report permissions', () => {
    const supportPerms = ROLE_PERMISSIONS.support_agent;
    expect(supportPerms).toContain(PERMISSIONS.USERS_VIEW);
    expect(supportPerms).toContain(PERMISSIONS.REPORTS_VIEW);
    expect(supportPerms).toContain(PERMISSIONS.REPORTS_RESOLVE);
    expect(supportPerms).not.toContain(PERMISSIONS.USERS_BAN);
  });

  it('analytics_manager has analytics and leaderboard permissions', () => {
    const analyticsPerms = ROLE_PERMISSIONS.analytics_manager;
    expect(analyticsPerms).toContain(PERMISSIONS.ANALYTICS_VIEW);
    expect(analyticsPerms).toContain(PERMISSIONS.LEADERBOARD_MANAGE);
    expect(analyticsPerms).toHaveLength(2);
  });

  it('challenge_manager has challenge and media view permissions', () => {
    const challengePerms = ROLE_PERMISSIONS.challenge_manager;
    expect(challengePerms).toContain(PERMISSIONS.CHALLENGES_MANAGE);
    expect(challengePerms).toContain(PERMISSIONS.MEDIA_VIEW);
    expect(challengePerms).toHaveLength(2);
  });

  it('defines exactly 7 roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(7);
  });
});

describe('hasPermission', () => {
  it('returns true when user has the required permission', () => {
    const userPerms = [PERMISSIONS.MEDIA_VIEW, PERMISSIONS.MEDIA_APPROVE];
    expect(hasPermission(userPerms, PERMISSIONS.MEDIA_VIEW)).toBe(true);
  });

  it('returns false when user lacks the required permission', () => {
    const userPerms = [PERMISSIONS.MEDIA_VIEW];
    expect(hasPermission(userPerms, PERMISSIONS.MEDIA_APPROVE)).toBe(false);
  });

  it('checks all permissions when given an array (all must match)', () => {
    const userPerms = [PERMISSIONS.MEDIA_VIEW, PERMISSIONS.MEDIA_APPROVE, PERMISSIONS.MEDIA_REJECT];
    expect(hasPermission(userPerms, [PERMISSIONS.MEDIA_VIEW, PERMISSIONS.MEDIA_APPROVE])).toBe(true);
  });

  it('returns false if any permission in array is missing', () => {
    const userPerms = [PERMISSIONS.MEDIA_VIEW];
    expect(hasPermission(userPerms, [PERMISSIONS.MEDIA_VIEW, PERMISSIONS.MEDIA_APPROVE])).toBe(false);
  });

  it('returns true for empty required array', () => {
    expect(hasPermission([], [])).toBe(true);
  });

  it('returns false for empty user permissions with a requirement', () => {
    expect(hasPermission([], PERMISSIONS.MEDIA_VIEW)).toBe(false);
  });

  it('works with super_admin role permissions', () => {
    const superAdminPerms = ROLE_PERMISSIONS.super_admin;
    expect(hasPermission(superAdminPerms, PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    expect(hasPermission(superAdminPerms, PERMISSIONS.USERS_BAN)).toBe(true);
    expect(hasPermission(superAdminPerms, PERMISSIONS.AUDIT_VIEW)).toBe(true);
  });
});

describe('hasAnyPermission', () => {
  it('returns true if user has at least one of the required permissions', () => {
    const userPerms = [PERMISSIONS.MEDIA_VIEW];
    expect(hasAnyPermission(userPerms, [PERMISSIONS.MEDIA_VIEW, PERMISSIONS.MEDIA_APPROVE])).toBe(true);
  });

  it('returns false if user has none of the required permissions', () => {
    const userPerms = [PERMISSIONS.ANALYTICS_VIEW];
    expect(hasAnyPermission(userPerms, [PERMISSIONS.MEDIA_VIEW, PERMISSIONS.MEDIA_APPROVE])).toBe(false);
  });

  it('returns false for empty required array', () => {
    expect(hasAnyPermission([PERMISSIONS.MEDIA_VIEW], [])).toBe(false);
  });

  it('returns false for empty user permissions', () => {
    expect(hasAnyPermission([], [PERMISSIONS.MEDIA_VIEW])).toBe(false);
  });
});
