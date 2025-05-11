import { Request, Response } from "express";
import { storage } from "../storage";
import bcrypt from "bcrypt";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Permission, UserRole, hasPermission } from "@shared/permissions";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Password hashing utility function
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Login Handler
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Set user session
    req.session.userId = user.id;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "An error occurred during login" });
  }
}

// Register Handler
export async function register(req: Request, res: Response) {
  try {
    // Validate incoming data
    const userSchema = insertUserSchema.extend({
      password: z.string().min(8, "Password must be at least 8 characters"),
      email: z.string().email("Invalid email address"),
    });
    
    const validatedData = userSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Set role (first user is admin, others are regular users)
    const users = await storage.getAllUsers();
    const role = users.length === 0 ? UserRole.ADMIN : UserRole.USER;
    
    // Create user
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
      role
    });
    
    // Set user session
    req.session.userId = user.id;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Registration error:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: "An error occurred during registration" });
  }
}

// Logout Handler
export function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "An error occurred during logout" });
    }
    
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
}

// Get Current User Handler
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "An error occurred while fetching user data" });
  }
}

// Update User Profile Handler
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Ensure users can only update their own profile unless they're admin
    if (req.session.userId !== userId && !hasPermission(req.user, Permission.MANAGE_USERS)) {
      return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
    }
    
    // Validate incoming data
    const updateSchema = z.object({
      email: z.string().email().optional(),
      fullName: z.string().optional().nullable(),
    });
    
    const validatedData = updateSchema.parse(req.body);
    
    // Update user
    const updatedUser = await storage.updateUser(userId, validatedData);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Update profile error:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: "An error occurred while updating profile" });
  }
}

// Change Password Handler
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Ensure users can only change their own password unless they're admin
    if (req.session.userId !== userId && !hasPermission(req.user, Permission.MANAGE_USERS)) {
      return res.status(403).json({ message: "Forbidden: You can only change your own password" });
    }
    
    // Validate incoming data
    const passwordSchema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    });
    
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    
    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Skip current password check for admins changing other users' passwords
    if (req.session.userId === userId) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user
    await storage.updateUser(userId, { password: hashedPassword });
    
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: "An error occurred while changing password" });
  }
}

// Admin: Get All Users
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await storage.getAllUsers();
    
    // Return users without passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ message: "An error occurred while fetching users" });
  }
}

// Admin: Delete User
export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Prevent admins from deleting themselves
    if (req.session.userId === userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    
    // Prevent deleting the last admin
    const users = await storage.getAllUsers();
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    
    if (admins.length === 1 && admins[0].id === userId) {
      return res.status(400).json({ message: "Cannot delete the last admin user" });
    }
    
    // Delete user
    const deleted = await storage.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "An error occurred while deleting user" });
  }
}