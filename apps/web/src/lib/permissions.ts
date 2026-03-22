import { prisma } from "@pixelstock/database";

// ─── Permission Constants ───────────────────────────────────────────
export const PERMISSIONS = {
  // Media
  MEDIA_VIEW: 'media:view',
  MEDIA_APPROVE: 'media:approve',
  MEDIA_REJECT: 'media:reject',
  MEDIA_FEATURE: 'media:feature',
  MEDIA_REMOVE: 'media:remove',
  MEDIA_BULK_ACTION: 'media:bulk',

  // Users
  USERS_VIEW: 'users:view',
  USERS_BAN: 'users:ban',
  USERS_VERIFY: 'users:verify',
  USERS_MANAGE_ROLES: 'users:manage_roles',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_RESOLVE: 'reports:resolve',

  // Challenges
  CHALLENGES_MANAGE: 'challenges:manage',

  // Taxonomy
  TAXONOMY_MANAGE: 'taxonomy:manage',

  // CMS
  CMS_MANAGE: 'cms:manage',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',

  // Audit
  AUDIT_VIEW: 'audit:view',

  // Settings
  SETTINGS_MANAGE: 'settings:manage',

  // Leaderboard
  LEADERBOARD_MANAGE: 'leaderboard:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Role Definitions ───────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  content_moderator: [
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_APPROVE,
    PERMISSIONS.MEDIA_REJECT,
    PERMISSIONS.MEDIA_FEATURE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_RESOLVE,
  ],
  curator: [
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_FEATURE,
    PERMISSIONS.CMS_MANAGE,
    PERMISSIONS.TAXONOMY_MANAGE,
  ],
  support_agent: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_RESOLVE,
  ],
  analytics_manager: [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.LEADERBOARD_MANAGE,
  ],
  challenge_manager: [
    PERMISSIONS.CHALLENGES_MANAGE,
    PERMISSIONS.MEDIA_VIEW,
  ],
  developer: [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
};

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Fetch all permissions for a user by aggregating their role permissions.
 * Falls back to granting all permissions if the user has the legacy isAdmin flag.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isAdmin: true,
      roles: {
        select: {
          role: {
            select: { permissions: true },
          },
        },
      },
    },
  });

  if (!user) return [];

  // Backward compatibility: legacy isAdmin flag grants all permissions
  if (user.isAdmin) {
    return Object.values(PERMISSIONS);
  }

  // Aggregate permissions from all assigned roles, deduplicated
  const permissions = new Set<string>();
  for (const userRole of user.roles) {
    for (const permission of userRole.role.permissions) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions);
}

/**
 * Check if a user's permissions include the required permission(s).
 * Accepts a single permission string or an array (all must be present).
 */
export function hasPermission(userPermissions: string[], required: string | string[]): boolean {
  if (typeof required === 'string') {
    return userPermissions.includes(required);
  }
  return required.every((p) => userPermissions.includes(p));
}

/**
 * Check if a user's permissions include at least one of the listed permissions.
 */
export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((p) => userPermissions.includes(p));
}
