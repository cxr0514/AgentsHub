import { Request, Response } from 'express';
import { storage } from '../storage';
import { compare, hash } from 'bcrypt';
import { User } from '@shared/schema';
import { z } from 'zod';

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Register schema 
const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  fullName: z.string().optional(),
  role: z.string().optional(),
});

// Update user schema
const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  role: z.string().optional(),
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const SALT_ROUNDS = 10;

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

// Login handler
export async function login(req: Request, res: Response) {
  try {
    // Validate input
    const { username, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Check password
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Create session
    req.session.userId = user.id;
    
    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Login error:", error);
    return res.status(500).json({ message: "An error occurred during login" });
  }
}

// Register handler
export async function register(req: Request, res: Response) {
  try {
    // Validate input
    const userData = registerSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create user (regular user by default)
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'user',
    });
    
    // Create session
    req.session.userId = user.id;
    
    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "An error occurred during registration" });
  }
}

// Logout handler
export function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "An error occurred during logout" });
    }
    
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: "Logged out successfully" });
  });
}

// Get current user handler
export async function getCurrentUser(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.status(200).json(null);
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(200).json(null);
    }
    
    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "An error occurred while fetching user data" });
  }
}

// Update user profile
export async function updateUserProfile(req: Request, res: Response) {
  const userId = parseInt(req.params.userId);
  
  // Ensure user exists
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  // Check if user is updating their own profile or is an admin
  if (req.session.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
  }
  
  try {
    // Validate input
    const updateData = updateUserSchema.parse(req.body);
    
    // If username is being changed, check if it already exists
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await storage.getUserByUsername(updateData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }
    
    // If non-admin tries to change role, block it
    if (updateData.role && req.user?.role !== 'admin') {
      delete updateData.role;
    }
    
    // Update user
    const updatedUser = await storage.updateUser(userId, updateData);
    
    // Return user (without password)
    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Update user error:", error);
    return res.status(500).json({ message: "An error occurred while updating user" });
  }
}

// Change password
export async function changePassword(req: Request, res: Response) {
  const userId = parseInt(req.params.userId);
  
  // Ensure user exists
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  // Check if user is changing their own password or is an admin
  if (req.session.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden: You can only change your own password" });
  }
  
  try {
    // Validate input
    const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);
    
    // Check current password (skip this check for admin)
    if (req.session.userId === userId) {
      const passwordMatch = await compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await storage.updateUser(userId, { password: hashedPassword });
    
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Password change error:", error);
    return res.status(500).json({ message: "An error occurred while changing password" });
  }
}

// Get all users (admin only)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await storage.getAllUsers();
    
    // Return users without passwords
    const usersWithoutPasswords = users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ message: "An error occurred while fetching users" });
  }
}

// Delete user (admin only)
export async function deleteUser(req: Request, res: Response) {
  const userId = parseInt(req.params.userId);
  
  // Ensure user exists
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  try {
    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const admins = (await storage.getAllUsers()).filter(u => u.role === 'admin');
      if (admins.length <= 1) {
        return res.status(400).json({ message: "Cannot delete the last admin user" });
      }
    }
    
    // Delete user
    await storage.deleteUser(userId);
    
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "An error occurred while deleting user" });
  }
}