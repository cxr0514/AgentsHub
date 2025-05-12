import { Request, Response, NextFunction } from 'express';
import { MFAService } from '../services/mfaService';

/**
 * Middleware to check if a user is authenticated
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Not authenticated" });
};

/**
 * Middleware to check if a user has completed MFA verification if enabled
 */
export const requireMfaIfEnabled = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user;
  // Check if MFA is enabled for the user and whether MFA verification has been completed for this session
  if (user?.mfaEnabled && !req.session?.mfaVerified) {
    return res.status(403).json({ 
      message: "MFA verification required",
      requireMfa: true
    });
  }

  return next();
};

/**
 * Middleware to check if a user is authenticated and is an admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user?.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ message: "Unauthorized: Admin access required" });
};