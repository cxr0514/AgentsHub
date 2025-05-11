import { createContext, ReactNode, useContext } from "react";
import { Permission, hasPermission, isAdmin, getUserPermissions } from "@shared/permissions";
import { useAuth } from "@/hooks/use-auth";

// Context for managing permissions
type PermissionsContextType = {
  hasPermission: (permission: Permission) => boolean;
  isAdmin: boolean;
  userPermissions: Permission[];
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

// Provider component
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Check if a user has a specific permission
  const checkPermission = (permission: Permission) => {
    return hasPermission(user, permission);
  };
  
  // Get all user permissions
  const userPermissions = getUserPermissions(user);
  
  // Check if the user is an admin
  const adminStatus = isAdmin(user);
  
  return (
    <PermissionsContext.Provider 
      value={{ 
        hasPermission: checkPermission, 
        isAdmin: adminStatus,
        userPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook for using permissions throughout the app
export function usePermissions() {
  const context = useContext(PermissionsContext);
  
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  
  return context;
}