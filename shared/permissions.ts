import { User } from "./schema";

// Define user roles
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// Define permissions
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

// Define role-based permissions map
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_PROPERTIES,
    Permission.SAVE_PROPERTIES,
    Permission.GENERATE_REPORTS,
    Permission.MANAGE_OWN_PROFILE,
  ],
  [UserRole.ADMIN]: [
    // Admins have all user permissions
    Permission.VIEW_PROPERTIES,
    Permission.SAVE_PROPERTIES,
    Permission.GENERATE_REPORTS,
    Permission.MANAGE_OWN_PROFILE,
    
    // Admin-specific permissions
    Permission.MANAGE_API_KEYS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SUBSCRIPTIONS,
    Permission.VIEW_SYSTEM_STATS,
    Permission.MANAGE_MLS_INTEGRATION,
  ],
};

// Check if a user has a specific permission
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  
  const userRole = user.role as UserRole;
  const permissions = rolePermissions[userRole] || [];
  
  return permissions.includes(permission);
}

// Check if a user is an admin
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.ADMIN;
}

// Get all permissions for a user
export function getUserPermissions(user: User | null | undefined): Permission[] {
  if (!user) return [];
  
  const userRole = user.role as UserRole;
  return rolePermissions[userRole] || [];
}