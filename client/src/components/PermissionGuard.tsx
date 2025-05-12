import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission, Permission, isAdmin } from '@/lib/permissions';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null
}: PermissionGuardProps) {
  const { user } = useAuth();
  
  if (hasPermission(user, permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({
  children,
  fallback = null
}: AdminGuardProps) {
  const { user } = useAuth();
  
  if (isAdmin(user)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}