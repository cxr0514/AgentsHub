import { Router } from 'express';
import { db } from '../db';
import { rentalProperties } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from '../vite';
import { analyzeRentalProperty } from '../services/perplexityService';

const router = Router();

// Get all rental properties
router.get('/api/rental-properties', async (req, res) => {
  try {
    const properties = await db.select().from(rentalProperties);
    res.json(properties);
  } catch (error) {
    log(`Error fetching rental properties: ${error instanceof Error ? error.message : 'Unknown error'}`, 'rental-data');
    res.status(500).json({ error: 'Failed to fetch rental properties' });
  }
});

// Get a single rental property
router.get('/api/rental-properties/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    const [property] = await db.select().from(rentalProperties).where(eq(rentalProperties.id, id));
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    log(`Error fetching rental property: ${error instanceof Error ? error.message : 'Unknown error'}`, 'rental-data');
    res.status(500).json({ error: 'Failed to fetch rental property' });
  }
});

// Get a rental property with AI analysis
router.get('/api/rental-properties/:id/analysis', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    const [property] = await db.select().from(rentalProperties).where(eq(rentalProperties.id, id));
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Generate AI analysis
    const analysis = await analyzeRentalProperty(property);
    
    res.json({
      property,
      analysis
    });
  } catch (error) {
    log(`Error analyzing rental property: ${error instanceof Error ? error.message : 'Unknown error'}`, 'rental-data');
    res.status(500).json({ error: 'Failed to analyze rental property' });
  }
});

export default router;