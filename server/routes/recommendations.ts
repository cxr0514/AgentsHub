import { Router } from 'express';
import { storage } from '../storage';
import { generatePropertyRecommendations } from '../services/aiService';

const router = Router();

// Get property recommendations for a user
router.get('/', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get saved recommendations
    const recommendations = await storage.getPropertyRecommendationsByUser(userId);
    
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Generate new recommendations
router.post('/generate', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's saved searches and saved properties for preference analysis
    const savedSearches = await storage.getSavedSearchesByUser(userId);
    const savedProperties = await storage.getSavedPropertiesByUser(userId);
    
    // Get all properties to recommend from
    const allProperties = await storage.getAllProperties();
    
    // Build user preferences for AI recommendation
    const userPreferences = {
      savedSearches,
      savedProperties,
      user
    };

    // Generate AI recommendations
    const recommendations = await generatePropertyRecommendations(
      user,
      allProperties,
      userPreferences
    );

    // Save the recommendations
    const savedRecommendation = await storage.createPropertyRecommendation({
      userId,
      recommendations,
      preferences: userPreferences
    });

    return res.status(201).json(savedRecommendation);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;