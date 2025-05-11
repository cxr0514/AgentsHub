import { Request, Response } from "express";
import { storage } from "../storage";
import { PropertyFilters } from "../storage";

/**
 * Get all properties with optional filtering
 */
export async function getAllProperties(req: Request, res: Response) {
  try {
    const filters: PropertyFilters = {};
    
    // Parse query parameters
    if (req.query.location) {
      filters.location = req.query.location as string;
    }
    
    if (req.query.propertyType) {
      filters.propertyType = req.query.propertyType as string;
    }
    
    if (req.query.minPrice) {
      filters.minPrice = parseFloat(req.query.minPrice as string);
    }
    
    if (req.query.maxPrice) {
      filters.maxPrice = parseFloat(req.query.maxPrice as string);
    }
    
    if (req.query.minBeds) {
      filters.minBeds = parseInt(req.query.minBeds as string, 10);
    }
    
    if (req.query.minBaths) {
      filters.minBaths = parseFloat(req.query.minBaths as string);
    }
    
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    
    if (req.query.zipCode) {
      filters.zipCode = req.query.zipCode as string;
    }
    
    if (req.query.yearBuilt) {
      filters.yearBuilt = parseInt(req.query.yearBuilt as string, 10);
    }
    
    // Get properties with filters
    const properties = await storage.getPropertiesByFilters(filters);
    
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(req: Request, res: Response) {
  try {
    const propertyId = parseInt(req.params.id, 10);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
}

/**
 * Create a new property
 */
export async function createProperty(req: Request, res: Response) {
  try {
    const property = await storage.createProperty(req.body);
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
}

/**
 * Update an existing property
 */
export async function updateProperty(req: Request, res: Response) {
  try {
    const propertyId = parseInt(req.params.id, 10);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    const property = await storage.updateProperty(propertyId, req.body);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
}