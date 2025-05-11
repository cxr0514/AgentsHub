import { Request, Response } from "express";
import { storage } from "../storage";
import { insertUserSchema, User } from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Add session data type
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Create scrypt async version
const scryptAsync = promisify(scrypt);

// Schema for login validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Schema for profile update
const profileUpdateSchema = z.object({
  fullName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional(),
});

// Function to hash a password
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Function to compare passwords
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Login endpoint
export async function login(req: Request, res: Response) {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    // Get user by username
    const user = await storage.getUserByUsername(validatedData.username);
    
    // Check if user exists and password is correct
    if (!user || !(await comparePasswords(validatedData.password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Set userId in session
    req.session.userId = user.id;
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Register endpoint
export async function register(req: Request, res: Response) {
  try {
    // Validate request body
    const validatedData = insertUserSchema
      .extend({
        confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
      .parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user with hashed password
    const { confirmPassword, ...userData } = validatedData;
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    
    // Set userId in session
    req.session.userId = user.id;
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Logout endpoint
export function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
}

// Get current user endpoint
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
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Update user profile endpoint
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user exists
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Validate request body
    const validatedData = profileUpdateSchema.parse(req.body);
    
    // Update user
    const updatedUser = await storage.updateUser(userId, validatedData);
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Change password endpoint
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user exists
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);
    
    // Check if current password is correct
    if (!(await comparePasswords(validatedData.currentPassword, existingUser.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword);
    
    // Update user with new password
    await storage.updateUser(userId, { password: hashedPassword });
    
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get all users endpoint (admin only)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await storage.getAllUsers();
    
    // Return users without passwords
    const usersWithoutPasswords = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
    return res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Delete user endpoint (admin only)
export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user exists
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Delete user
    await storage.deleteUser(userId);
    
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}