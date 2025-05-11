import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Permission, hasPermission } from "@shared/permissions";

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { user } = useAuth();
  
  // Check if the user has the required permission
  if (hasPermission(user, permission)) {
    return <>{children}</>;
  }
  
  // Return fallback if user doesn't have permission
  return <>{fallback}</>;
}