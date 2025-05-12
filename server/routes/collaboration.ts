import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { insertSharedPropertySchema, insertPropertyCommentSchema } from '@shared/schema';
import { log } from '../vite';

/**
 * API Routes for user collaboration features
 */
const router = Router();

// Generate a secure random token for property sharing
function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// Helper to validate email addresses
const emailSchema = z.string().email();

/**
 * Share a property with someone via email
 * POST /api/collaboration/share-property
 */
router.post('/share-property', isAuthenticated, async (req, res) => {
  try {
    // Validate request body
    const shareSchema = insertSharedPropertySchema
      .omit({ id: true, accessToken: true, hasAccessed: true, createdAt: true })
      .extend({
        expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined)
      });
      
    const validatedData = shareSchema.parse({
      ...req.body,
      ownerId: req.user?.id
    });
    
    // Validate email
    try {
      emailSchema.parse(validatedData.sharedWith);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    
    // Generate a secure random token
    const accessToken = generateSecureToken();
    
    // Create the shared property record
    const sharedProperty = await storage.createSharedProperty({
      ...validatedData,
      accessToken,
      hasAccessed: false
    });
    
    // TODO: Send email notification (in a production environment)
    log(`Property shared with ${validatedData.sharedWith}`, 'collaboration');
    
    // Return the created record (without exposing the full token)
    return res.status(201).json({
      ...sharedProperty,
      accessToken: `${accessToken.substring(0, 8)}...` // Only show first few chars for security
    });
  } catch (error) {
    log(`Error sharing property: ${error}`, 'collaboration');
    return res.status(400).json({ message: 'Invalid request data', error: String(error) });
  }
});

/**
 * Get all properties shared by the current user
 * GET /api/collaboration/shared-by-me
 */
router.get('/shared-by-me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const sharedProperties = await storage.getSharedPropertiesByOwner(userId);
    
    // Map to include property details
    const results = await Promise.all(sharedProperties.map(async (shared) => {
      const property = await storage.getProperty(shared.propertyId);
      return {
        ...shared,
        property,
        // Mask the access token for security
        accessToken: `${shared.accessToken.substring(0, 8)}...`
      };
    }));
    
    return res.json(results);
  } catch (error) {
    log(`Error fetching shared properties: ${error}`, 'collaboration');
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

/**
 * Get all properties shared with the current user
 * GET /api/collaboration/shared-with-me
 */
router.get('/shared-with-me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the user's email
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const sharedProperties = await storage.getSharedPropertiesByEmail(user.email);
    
    // Map to include property details
    const results = await Promise.all(sharedProperties.map(async (shared) => {
      const property = await storage.getProperty(shared.propertyId);
      return {
        ...shared,
        property,
        // Don't include access token at all for shared-with-me entries
        accessToken: undefined
      };
    }));
    
    return res.json(results);
  } catch (error) {
    log(`Error fetching shared-with-me properties: ${error}`, 'collaboration');
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

/**
 * Access a shared property with a token (public access, no auth required)
 * GET /api/collaboration/shared/:token
 */
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the shared property by token
    const sharedProperty = await storage.getSharedPropertyByToken(token);
    
    if (!sharedProperty) {
      return res.status(404).json({ message: 'Shared property not found or link expired' });
    }
    
    // Check if link has expired
    if (sharedProperty.expiresAt && new Date(sharedProperty.expiresAt) < new Date()) {
      return res.status(403).json({ message: 'This shared link has expired' });
    }
    
    // Get the property
    const property = await storage.getProperty(sharedProperty.propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Get the owner's info (but don't include sensitive data)
    const owner = await storage.getUser(sharedProperty.ownerId);
    const safeOwner = owner ? { 
      id: owner.id,
      username: owner.username,
      email: owner.email
    } : null;
    
    // Mark as accessed if not already
    if (!sharedProperty.hasAccessed) {
      await storage.updateSharedProperty(sharedProperty.id, { hasAccessed: true });
    }
    
    // Get comments if any
    const comments = await storage.getPropertyCommentsBySharedProperty(sharedProperty.id);
    
    // Return the property along with sharing metadata and comments
    return res.json({
      property,
      sharedBy: safeOwner,
      sharedAt: sharedProperty.createdAt,
      notes: sharedProperty.notes,
      allowComments: sharedProperty.allowComments,
      comments
    });
  } catch (error) {
    log(`Error accessing shared property: ${error}`, 'collaboration');
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

/**
 * Add a comment to a shared property
 * POST /api/collaboration/shared/:token/comments
 */
router.post('/shared/:token/comments', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the shared property by token
    const sharedProperty = await storage.getSharedPropertyByToken(token);
    
    if (!sharedProperty) {
      return res.status(404).json({ message: 'Shared property not found or link expired' });
    }
    
    // Check if link has expired
    if (sharedProperty.expiresAt && new Date(sharedProperty.expiresAt) < new Date()) {
      return res.status(403).json({ message: 'This shared link has expired' });
    }
    
    // Check if comments are allowed
    if (!sharedProperty.allowComments) {
      return res.status(403).json({ message: 'Comments are not allowed on this shared property' });
    }
    
    // Prepare comment data
    let commentData: any = {
      propertyId: sharedProperty.propertyId,
      sharedPropertyId: sharedProperty.id,
      comment: req.body.comment,
      commenterName: req.body.commenterName,
      commenterEmail: req.body.commenterEmail
    };
    
    // If the user is authenticated, use their ID
    if (req.user) {
      commentData.userId = req.user.id;
      // No need for commenter name and email when user is authenticated
      delete commentData.commenterName;
      delete commentData.commenterEmail;
    } else {
      // Validate commenter name and email for non-authenticated users
      if (!commentData.commenterName || !commentData.commenterEmail) {
        return res.status(400).json({ message: 'Name and email are required for comments' });
      }
      
      try {
        emailSchema.parse(commentData.commenterEmail);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
    }
    
    // Validate the comment
    if (!commentData.comment || commentData.comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
    
    // Create the comment
    const comment = await storage.createPropertyComment(commentData);
    
    // Return the created comment
    return res.status(201).json(comment);
  } catch (error) {
    log(`Error adding comment: ${error}`, 'collaboration');
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

/**
 * Delete a shared property
 * DELETE /api/collaboration/shared/:id
 */
router.delete('/shared/:id', isAuthenticated, async (req, res) => {
  try {
    const sharedPropertyId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    // Check if shared property exists and belongs to the current user
    const sharedProperty = await storage.getSharedProperty(sharedPropertyId);
    
    if (!sharedProperty) {
      return res.status(404).json({ message: 'Shared property not found' });
    }
    
    if (sharedProperty.ownerId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this shared property' });
    }
    
    // Delete the shared property
    await storage.deleteSharedProperty(sharedPropertyId);
    
    return res.status(200).json({ message: 'Shared property deleted successfully' });
  } catch (error) {
    log(`Error deleting shared property: ${error}`, 'collaboration');
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

/**
 * Team Collaboration - Create a new team
 * POST /api/collaboration/teams
 */
router.post('/teams', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Validate team data
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    
    // Create the team
    const team = await storage.createCollaborationTeam({
      name,
      description,
      ownerId: userId
    });
    
    // Add the creator as a team member with "owner" role
    await storage.addTeamMember({
      teamId: team.id,
      userId,
      role: 'owner'
    });
    
    return res.status(201).json(team);
  } catch (error) {
    log(`Error creating team: ${error}`, 'collaboration');
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

/**
 * Team Collaboration - Get user's teams
 * GET /api/collaboration/teams
 */
router.get('/teams', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get all teams the user is part of
    const teams = await storage.getTeamsByUserId(userId);
    
    return res.json(teams);
  } catch (error) {
    log(`Error fetching teams: ${error}`, 'collaboration');
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

export default router;