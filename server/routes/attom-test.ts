import express from "express";
import { PropertyFilters } from "../storage";
import { searchPropertiesViaAttom } from "../services/propertySearchService";

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

// Test search endpoint (no authentication required for testing)
router.get("/search", async (req, res) => {
  try {
    // This endpoint can be used for testing the ATTOM API directly
    console.log("ATTOM Test Search API called with params:", req.query);
    
    // Extract search parameters from query string
    const filters: PropertyFilters = {};
    
    // Location-based search parameters
    if (req.query.location) filters.location = req.query.location as string;
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
    
    // If no search parameters are provided, use default filters (Atlanta area)
    if (Object.keys(filters).length === 0) {
      filters.location = "Atlanta";
      filters.state = "GA";
      filters.propertyType = "Single Family";
    }
    
    // Perform the search via ATTOM API
    const properties = await searchPropertiesViaAttom(filters);
    
    return res.json(properties);
  } catch (error) {
    console.error("Error in ATTOM test search:", error);
    res.status(500).json({ 
      message: "Error searching properties", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;