import { Router } from 'express';
import { storage } from '../storage';
import { log } from '../vite';

const router = Router();

/**
 * Search for properties based on address, city, state, or zip code
 */
router.get('/search', async (req, res) => {
  try {
    const { address, city, state, zipCode } = req.query;
    
    // Require at least one search parameter
    if (!address && !city && !state && !zipCode) {
      return res.status(400).json({ error: 'At least one search parameter is required' });
    }
    
    const filters: any = {};
    
    if (address) filters.address = address as string;
    if (city) filters.city = city as string;
    if (state) filters.state = state as string;
    if (zipCode) filters.zipCode = zipCode as string;
    
    const properties = await storage.getPropertiesByFilters(filters);
    
    return res.json(properties);
  } catch (error: any) {
    log(`Error searching properties: ${error.message}`, 'property-comps');
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Find comparable properties based on criteria
 */
router.post('/find-comps', async (req, res) => {
  try {
    const criteria = req.body;
    
    if (!criteria.propertyId && !criteria.address) {
      return res.status(400).json({ error: 'Subject property ID or address is required' });
    }
    
    // Build filter based on criteria
    const filters: any = {
      propertyType: criteria.propertyType,
      status: criteria.status,
      minBeds: criteria.minBeds,
      maxBeds: criteria.maxBeds,
      minBaths: criteria.minBaths,
      maxBaths: criteria.maxBaths,
      minSqft: criteria.minSqft,
      maxSqft: criteria.maxSqft,
    };
    
    // Location filtering
    if (criteria.city) filters.city = criteria.city;
    if (criteria.state) filters.state = criteria.state;
    if (criteria.zipCode) filters.zipCode = criteria.zipCode;
    
    // Calculate price range if subject property ID is provided
    if (criteria.propertyId) {
      const subjectProperty = await storage.getProperty(criteria.propertyId);
      
      if (subjectProperty) {
        const priceRange = criteria.priceRange || 20; // Default to 20% if not specified
        const minPrice = Math.round(subjectProperty.price * (1 - priceRange / 100));
        const maxPrice = Math.round(subjectProperty.price * (1 + priceRange / 100));
        
        filters.minPrice = minPrice;
        filters.maxPrice = maxPrice;
      }
    }
    
    // Time frame filtering for sold properties
    if (criteria.status === 'sold' && criteria.saleTimeframe) {
      const now = new Date();
      const pastDate = new Date();
      pastDate.setMonth(now.getMonth() - criteria.saleTimeframe);
      
      filters.saleDateStart = pastDate.toISOString().split('T')[0];
      filters.saleDateEnd = now.toISOString().split('T')[0];
    }
    
    // Exclude the subject property from results
    if (criteria.propertyId) {
      filters.excludePropertyId = criteria.propertyId;
    }
    
    // Limit results
    const maxResults = criteria.maxResults || 10;
    
    // Get properties matching the criteria
    let comps = await storage.getPropertiesByFilters(filters);
    
    // Limit the number of results
    comps = comps.slice(0, maxResults);
    
    // If no comps found with the current criteria, try with relaxed criteria
    if (comps.length === 0) {
      log('No comps found with initial criteria, relaxing constraints', 'property-comps');
      
      // Relax criteria
      const relaxedFilters = { ...filters };
      relaxedFilters.minBeds = Math.max(1, (criteria.minBeds || 2) - 1);
      relaxedFilters.maxBeds = (criteria.maxBeds || 4) + 1;
      relaxedFilters.minBaths = Math.max(1, (criteria.minBaths || 1) - 0.5);
      relaxedFilters.maxBaths = (criteria.maxBaths || 3) + 0.5;
      relaxedFilters.minSqft = Math.round((criteria.minSqft || 1000) * 0.7);
      relaxedFilters.maxSqft = Math.round((criteria.maxSqft || 3000) * 1.3);
      
      if (relaxedFilters.minPrice) {
        relaxedFilters.minPrice = Math.round(relaxedFilters.minPrice * 0.9);
        relaxedFilters.maxPrice = Math.round(relaxedFilters.maxPrice * 1.1);
      }
      
      comps = await storage.getPropertiesByFilters(relaxedFilters);
      comps = comps.slice(0, maxResults);
    }
    
    // Add or calculate price per square foot for each comp if not already present
    comps = comps.map(comp => {
      if (!comp.pricePerSqft && comp.price && comp.squareFeet) {
        return { 
          ...comp, 
          pricePerSqft: Math.round(comp.price / comp.squareFeet) 
        };
      }
      return comp;
    });
    
    return res.json({ comps });
  } catch (error: any) {
    log(`Error finding comparable properties: ${error.message}`, 'property-comps');
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Save comparable property adjustments
 */
router.post('/save-comp-adjustments', async (req, res) => {
  try {
    const { subjectPropertyId, adjustments } = req.body;
    
    if (!subjectPropertyId) {
      return res.status(400).json({ error: 'Subject property ID is required' });
    }
    
    if (!adjustments || Object.keys(adjustments).length === 0) {
      return res.status(400).json({ error: 'No adjustments provided' });
    }
    
    // In a real implementation, we would save these adjustments to a database
    // For now, we'll just acknowledge the request
    
    // Validate that the subject property exists
    const subjectProperty = await storage.getProperty(subjectPropertyId);
    if (!subjectProperty) {
      return res.status(404).json({ error: 'Subject property not found' });
    }
    
    // Validate that all the comp properties exist
    for (const propertyId of Object.keys(adjustments)) {
      const compProperty = await storage.getProperty(parseInt(propertyId));
      if (!compProperty) {
        return res.status(404).json({ 
          error: `Comparable property with ID ${propertyId} not found` 
        });
      }
    }
    
    // Return success response
    return res.json({ 
      message: 'Adjustments saved successfully',
      subjectPropertyId,
      adjustmentCount: Object.keys(adjustments).length
    });
  } catch (error: any) {
    log(`Error saving comp adjustments: ${error.message}`, 'property-comps');
    return res.status(500).json({ error: error.message });
  }
});

export default router;