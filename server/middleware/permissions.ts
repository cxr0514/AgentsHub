import { Request, Response, NextFunction } from "express";
import { Permission, hasPermission, isAdmin } from "../../shared/permissions";

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAuthenticated(): boolean;
    }
  }
}

// Middleware to check if user has a specific permission
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized: Please log in first" });
    }
    
    // Check if user has the required permission
    const user = req.user;
    if (!hasPermission(user, permission)) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
    }
    
    next();
  };
}

// Middleware to check if user is an admin
export function requireAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized: Please log in first" });
    }
    
    // Check if user is an admin
    const user = req.user;
    if (!isAdmin(user)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  };
}

// Middleware to check if user is accessing their own resource
export function requireSelf(userIdParam: string = "userId") {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized: Please log in first" });
    }
    
    // Check if user is accessing their own resource or is an admin
    const user = req.user;
    const requestedUserId = parseInt(req.params[userIdParam]);
    
    if (isNaN(requestedUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    if (user?.id !== requestedUserId && !isAdmin(user)) {
      return res.status(403).json({ message: "Forbidden: You can only access your own resources" });
    }
    
    next();
  };
}