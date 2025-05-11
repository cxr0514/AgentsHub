import { ReactNode } from "react";
import { Permission } from "@shared/permissions";
import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that renders its children only if the user has the specified permission.
 * Otherwise, it renders the fallback component (if provided).
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * A component that renders its children only if the user is an admin.
 * Otherwise, it renders the fallback component (if provided).
 */
export function AdminGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = usePermissions();
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}