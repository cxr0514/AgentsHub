import express from "express";
import { storage } from "../storage";
import { PropertyFilters } from "../storage";
import { hasPermission, Permission } from "../../shared/permissions";
import { searchPropertiesViaAttom } from "../services/propertySearchService";
import { isAuthenticated } from "../middleware/auth";
import { Property } from "../../shared/schema";

const router = express.Router();

// Health check endpoint (does not require authentication)
router.get("/health", async (req, res) => {
  try {
    const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
    
    if (!ATTOM_API_KEY) {
      return res.status(503).json({ 
        success: false, 
        message: "ATTOM API key is not configured" 
      });
    }
    
    // Simple health check for ATTOM API
    const response = await fetch("https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/id", {
      method: "GET",
      headers: {
        "apikey": ATTOM_API_KEY,
        "Accept": "application/json"
      }
    });
    
    if (response.ok) {
      res.json({ 
        success: true, 
        message: "ATTOM API is accessible",
        status: "ok"
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      res.status(503).json({ 
        success: false, 
        message: "ATTOM API is not responding correctly",
        status: "error",
        details: {
          statusCode: response.status,
          statusText: response.statusText,
          error: errorData
        }
      });
    }
  } catch (error) {
    console.error("ATTOM API health check failed:", error);
    res.status(503).json({ 
      success: false, 
      message: "ATTOM API health check failed", 
      status: "error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Search for properties using the ATTOM API (authenticated users only)
router.get("/search", isAuthenticated, async (req, res) => {
  try {
    // Only users with the view_properties permission can search properties
    if (!hasPermission(req.user, Permission.VIEW_PROPERTIES)) {
      return res.status(403).json({ message: "You don't have permission to search properties" });
    }
    
    // Extract search parameters from query string
    const filters: PropertyFilters = {};
    
    // Location-based search parameters
    if (req.query.location) filters.location = req.query.location as string;
    // Add city, state to filters (these are valid in PropertyFilters interface)
    if (req.query.city) filters.location = `${req.query.city}, ${req.query.state || ''}`;
    if (req.query.state) filters.state = req.query.state as string;
    if (req.query.zipCode) filters.zipCode = req.query.zipCode as string;
    
    // Geo-based search parameters
    if (req.query.lat && req.query.lng) {
      filters.lat = parseFloat(req.query.lat as string);
      filters.lng = parseFloat(req.query.lng as string);
      
      if (req.query.radius) {
        filters.radius = parseFloat(req.query.radius as string);
      } else {
        filters.radius = 5; // Default to 5 mile radius
      }
    }
    
    // Property characteristics
    if (req.query.propertyType) filters.propertyType = req.query.propertyType as string;
    if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice as string);
    if (req.query.minBeds) filters.minBeds = parseFloat(req.query.minBeds as string);
    if (req.query.maxBeds) filters.maxBeds = parseFloat(req.query.maxBeds as string);
    if (req.query.minBaths) filters.minBaths = parseFloat(req.query.minBaths as string);
    if (req.query.maxBaths) filters.maxBaths = parseFloat(req.query.maxBaths as string);
    if (req.query.minSqft) filters.minSqft = parseFloat(req.query.minSqft as string);
    if (req.query.maxSqft) filters.maxSqft = parseFloat(req.query.maxSqft as string);
    if (req.query.yearBuilt) filters.yearBuilt = req.query.yearBuilt as string;
    
    // Property status
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.statusList) {
      if (Array.isArray(req.query.statusList)) {
        filters.statusList = req.query.statusList as string[];
      } else {
        filters.statusList = [(req.query.statusList as string)];
      }
    }
    
    console.log('ATTOM search request with filters:', filters);
    
    // If no search parameters are provided, return an error
    if (Object.keys(filters).length === 0) {
      return res.status(400).json({ message: "At least one search parameter is required" });
    }
    
    // Perform the search via ATTOM API
    const properties = await searchPropertiesViaAttom(filters);
    
    // Track search for analytics (in the background, don't wait for it)
    if (req.user) {
      const searchParameters = JSON.stringify(filters);
      // You might want to save this search to the user's search history
      // storage.createSavedSearch({ userId: req.user.id, parameters: searchParameters, name: "ATTOM Search" });
    }
    
    return res.json(properties);
  } catch (error) {
    console.error("Error searching properties via ATTOM API:", error);
    res.status(500).json({ 
      message: "Error searching properties", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get property details using ATTOM API (authenticated users only)
router.get("/property/:id", isAuthenticated, async (req, res) => {
  try {
    // Only users with the view_properties permission can view property details
    if (!hasPermission(req.user, Permission.VIEW_PROPERTIES)) {
      return res.status(403).json({ message: "You don't have permission to view property details" });
    }
    
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    // First check our database for the property
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    // Return with extended ATTOM data if available
    if (property.externalId) {
      // TODO: If needed, fetch additional ATTOM details using property.externalId
      // For now, return the property from our database
    }
    
    return res.json(property);
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).json({ 
      message: "Error fetching property details", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get market trends for a specific location using ATTOM API (authenticated users only)
router.get("/market-trends", isAuthenticated, async (req, res) => {
  try {
    // Check permissions
    if (!hasPermission(req.user, Permission.VIEW_PROPERTIES)) {
      return res.status(403).json({ message: "You don't have permission to view market trends" });
    }
    
    // Extract location parameters
    const { city, state, zipCode } = req.query;
    
    if (!city || !state) {
      return res.status(400).json({ message: "City and state are required parameters" });
    }
    
    // Get market data from our database (which is synced with ATTOM API)
    const marketData = await storage.getMarketDataByLocation(
      city as string, 
      state as string, 
      zipCode as string
    );
    
    if (!marketData || marketData.length === 0) {
      return res.status(404).json({ message: "No market data found for this location" });
    }
    
    return res.json(marketData);
  } catch (error) {
    console.error("Error fetching market trends:", error);
    res.status(500).json({ 
      message: "Error fetching market trends", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;