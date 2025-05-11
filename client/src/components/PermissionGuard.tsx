import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Permission, hasPermission } from "@shared/permissions";

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { user } = useAuth();
  
  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }
  
  if (hasPermission(user, permission)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : null;
}