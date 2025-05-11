import { Request, Response, NextFunction } from "express";
import { Permission, hasPermission, isAdmin } from "@shared/permissions";
import { storage } from "../storage";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAuthenticated(): boolean;
    }
  }
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
  }
  
  next();
}

// Middleware to load user data if authenticated
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    console.error("Error loading user:", error);
    next();
  }
}

// Middleware to check if user has a specific permission
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First ensure user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
    }
    
    // Special case for MANAGE_OWN_PROFILE permission when userId parameter is provided
    if (permission === Permission.MANAGE_OWN_PROFILE && req.params.userId) {
      const requestedUserId = parseInt(req.params.userId);
      
      // Allow if user is managing their own profile
      if (req.session.userId === requestedUserId) {
        return next();
      }
      
      // Also allow admin users (who have MANAGE_USERS permission)
      if (isAdmin(req.user)) {
        return next();
      }
      
      // Otherwise deny access
      return res.status(403).json({ 
        message: "Forbidden: You don't have permission to access this resource" 
      });
    }
    
    // Load user if not already loaded
    if (!req.user && req.session.userId) {
      req.user = await storage.getUser(req.session.userId);
    }
    
    // Check if user has the required permission
    if (hasPermission(req.user, permission)) {
      return next();
    }
    
    // If we get here, user doesn't have the required permission
    return res.status(403).json({ 
      message: "Forbidden: You don't have permission to access this resource" 
    });
  };
}

// Middleware to check if user is an admin
export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First ensure user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
    }
    
    // Load user if not already loaded
    if (!req.user && req.session.userId) {
      req.user = await storage.getUser(req.session.userId);
    }
    
    // Check if user is an admin
    if (isAdmin(req.user)) {
      return next();
    }
    
    // If we get here, user is not an admin
    return res.status(403).json({ 
      message: "Forbidden: Admin access required" 
    });
  };
}