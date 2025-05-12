import { Router } from "express";
import { requirePermission } from "../middleware/permissions";
import { Permission } from "@shared/permissions";
import {
  fetchPropertyDetails,
  fetchPropertySaleHistory,
  fetchMarketStatistics,
  updateMarketData,
  syncMarketData
} from "../services/attomService";

const router = Router();

// Require authentication for all routes in this router
router.use(requirePermission(Permission.VIEW_PROPERTIES));

// Property details endpoint
router.get("/property-details", async (req, res) => {
  try {
    const { address, city, state, zipCode } = req.query;
    
    if (!address || !city || !state) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required parameters: address, city, and state are required" 
      });
    }
    
    const result = await fetchPropertyDetails(
      String(address),
      String(city),
      String(state),
      zipCode ? String(zipCode) : ""
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Property sale history endpoint
router.get("/property-history", async (req, res) => {
  try {
    const { address, city, state, zipCode } = req.query;
    
    if (!address || !city || !state) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required parameters: address, city, and state are required" 
      });
    }
    
    const result = await fetchPropertySaleHistory(
      String(address),
      String(city),
      String(state),
      zipCode ? String(zipCode) : ""
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching property sale history:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Market statistics endpoint
router.get("/market-statistics", async (req, res) => {
  try {
    const { city, state, zipCode } = req.query;
    
    if (!city || !state) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required parameters: city and state are required" 
      });
    }
    
    const result = await fetchMarketStatistics(
      String(city),
      String(state),
      zipCode ? String(zipCode) : undefined
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching market statistics:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Update market data endpoint
router.post("/update-market-data", requirePermission(Permission.MANAGE_MLS_INTEGRATION), async (req, res) => {
  try {
    const { city, state, zipCode } = req.body;
    
    if (!city || !state) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required parameters: city and state are required" 
      });
    }
    
    const result = await updateMarketData(
      String(city),
      String(state),
      zipCode ? String(zipCode) : undefined
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating market data:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Sync market data for multiple locations
router.post("/sync-market-data", requirePermission(Permission.MANAGE_MLS_INTEGRATION), async (req, res) => {
  try {
    const { locations } = req.body;
    
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Missing or invalid locations parameter. Expected an array of {city, state, zipCode} objects." 
      });
    }
    
    const result = await syncMarketData(locations);
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error syncing market data:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

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

// Test endpoints that don't require authentication (for development only)
if (process.env.NODE_ENV === 'development') {
  // Test property details endpoint
  router.get("/test/property-details", async (req, res) => {
    try {
      const { address, city, state, zipCode } = req.query;
      
      if (!address || !city || !state) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required parameters: address, city, and state are required" 
        });
      }
      
      const result = await fetchPropertyDetails(
        String(address),
        String(city),
        String(state),
        zipCode ? String(zipCode) : ""
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching property details:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  // Test property sale history endpoint
  router.get("/test/property-history", async (req, res) => {
    try {
      const { address, city, state, zipCode } = req.query;
      
      if (!address || !city || !state) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required parameters: address, city, and state are required" 
        });
      }
      
      const result = await fetchPropertySaleHistory(
        String(address),
        String(city),
        String(state),
        zipCode ? String(zipCode) : ""
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching property sale history:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  // Test market statistics endpoint
  router.get("/test/market-statistics", async (req, res) => {
    try {
      const { city, state, zipCode } = req.query;
      
      if (!city || !state) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required parameters: city and state are required" 
        });
      }
      
      const result = await fetchMarketStatistics(
        String(city),
        String(state),
        zipCode ? String(zipCode) : undefined
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching market statistics:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });
}

export default router;