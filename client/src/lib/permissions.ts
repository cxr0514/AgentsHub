import { User } from '@shared/schema';

export enum Permission {
  // User permissions (available to all authenticated users)
  VIEW_PROPERTIES = "view_properties",
  SAVE_PROPERTIES = "save_properties",
  GENERATE_REPORTS = "generate_reports",
  MANAGE_OWN_PROFILE = "manage_own_profile",
  
  // Admin permissions
  MANAGE_API_KEYS = "manage_api_keys",
  MANAGE_USERS = "manage_users",
  MANAGE_SUBSCRIPTIONS = "manage_subscriptions",
  VIEW_SYSTEM_STATS = "view_system_stats",
  MANAGE_MLS_INTEGRATION = "manage_mls_integration",
}

export const userRole = 'user';
export const adminRole = 'admin';

export const rolePermissions: Record<string, Permission[]> = {
  [userRole]: [
    Permission.VIEW_PROPERTIES,
    Permission.SAVE_PROPERTIES,
    Permission.GENERATE_REPORTS,
    Permission.MANAGE_OWN_PROFILE,
  ],
  [adminRole]: [
    Permission.VIEW_PROPERTIES,
    Permission.SAVE_PROPERTIES,
    Permission.GENERATE_REPORTS,
    Permission.MANAGE_OWN_PROFILE,
    Permission.MANAGE_API_KEYS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SUBSCRIPTIONS,
    Permission.VIEW_SYSTEM_STATS,
    Permission.MANAGE_MLS_INTEGRATION,
  ],
};

export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}

export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === adminRole;
}

export function getUserPermissions(user: User | null | undefined): Permission[] {
  if (!user) return [];
  return rolePermissions[user.role] || [];
}