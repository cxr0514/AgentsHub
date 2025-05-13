import { Router } from 'express';
import { importZillowRentals, countRentalProperties } from '../services/importers/zillowRentalImporter';
import { log } from '../vite';
import { db } from '../db';
import { rentalProperties, properties } from '@shared/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { analyzePropertyInvestment } from '../services/perplexityService';

const router = Router();

// Get rental properties
router.get('/', async (req, res) => {
  try {
    const { limit = '20', offset = '0', city } = req.query;
    
    let query = db.select().from(rentalProperties);
    
    if (city) {
      query = query.where(sql`LOWER(${rentalProperties.addressCity}) = LOWER(${city as string})`);
    }
    
    const rentals = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(desc(rentalProperties.createdAt));
    
    res.json(rentals);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error fetching rental properties: ${errorMessage}`, 'rental-data');
    res.status(500).json({ error: errorMessage });
  }
});

// Get rental property by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rental] = await db
      .select()
      .from(rentalProperties)
      .where(eq(rentalProperties.id, parseInt(id)));
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental property not found' });
    }
    
    res.json(rental);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error fetching rental property: ${errorMessage}`, 'rental-data');
    res.status(500).json({ error: errorMessage });
  }
});

// Import Zillow rental data from file
router.post('/import', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can import data' });
    }
    
    const filePath = 'attached_assets/Outscraper-20250513184410s1c.json';
    
    const result = await importZillowRentals(filePath);
    
    res.json({
      success: true,
      message: `Successfully imported ${result.imported} rental properties with ${result.errors} errors`,
      ...result
    });
  } catch (error) {
    log(`Error importing rental data: ${error.message}`, 'rental-data');
    res.status(500).json({ error: error.message });
  }
});

// Get count of rental properties
router.get('/stats/count', async (req, res) => {
  try {
    const count = await countRentalProperties();
    res.json({ count });
  } catch (error) {
    log(`Error counting rental properties: ${error.message}`, 'rental-data');
    res.status(500).json({ error: error.message });
  }
});

// Analyze a rental property as an investment using Perplexity AI
router.post('/analyze/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the rental property
    const [rental] = await db
      .select()
      .from(rentalProperties)
      .where(eq(rentalProperties.id, parseInt(id)));
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental property not found' });
    }
    
    // Extract base price from units
    let estimatedPrice = 0;
    if (rental.units && rental.units.length > 0) {
      const priceString = rental.units[0].price.replace(/[^0-9.]/g, '');
      estimatedPrice = parseInt(priceString, 10) || 0;
    }
    
    // Get bed count from first unit
    let beds = 0;
    if (rental.units && rental.units.length > 0) {
      beds = parseInt(rental.units[0].beds, 10) || 0;
    }
    
    // Get bath count from first unit if available
    let baths = 0;
    if (rental.units && rental.units.length > 0 && rental.units[0].baths) {
      baths = parseFloat(rental.units[0].baths) || 0;
    }
    
    // Create a full address for analysis
    const fullAddress = rental.address || `${rental.addressStreet}, ${rental.addressCity}, ${rental.addressState}`;
    
    // Use the Perplexity service to analyze the property
    const analysis = await analyzePropertyInvestment(
      fullAddress,
      estimatedPrice,
      rental.propertyType || 'apartment',
      0, // We don't have square footage in the data
      beds,
      baths
    );
    
    res.json({ 
      property: rental,
      analysis
    });
  } catch (error) {
    log(`Error analyzing rental property: ${error.message}`, 'rental-data');
    res.status(500).json({ error: error.message });
  }
});

export default router;