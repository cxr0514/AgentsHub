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

// Create two routers - one for authenticated routes, one for test routes
const router = Router();
const testRouter = Router();

// Authentication will be applied to individual routes as needed
// Removed the global authentication requirement to allow test endpoints

// Property details endpoint (requires authentication)
router.get("/property-details", requirePermission(Permission.VIEW_PROPERTIES), async (req, res) => {
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
    
    // If the result contains an error property, it's a fallback response
    if (result.error) {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.message || "Used fallback data due to API error",
        error: result.error
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Property sale history endpoint (requires authentication)
router.get("/property-history", requirePermission(Permission.VIEW_PROPERTIES), async (req, res) => {
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
    
    // If the result contains an error property, it's a fallback response
    if (result.error) {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.message || "Used fallback data due to API error",
        error: result.error
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching property sale history:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Market statistics endpoint (requires authentication)
router.get("/market-statistics", requirePermission(Permission.VIEW_PROPERTIES), async (req, res) => {
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
    
    // If the result contains an error property, it's a fallback response
    if (result.error || result.isFallback) {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.message || "Used fallback data due to API error",
        error: result.error
      });
    }
    
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
    
    // Check if the result contains a source indicating it's fallback data
    if (result.source === "fallback" || result.source === "fallback_error") {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.error ? `Error: ${result.error}` : "Used fallback data due to API limitations"
      });
    }
    
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
    
    // Check if any of the results contain fallback data
    const hasFallbacks = result.results.some(item => 
      item.source === "fallback" || item.source === "fallback_error"
    ) || result.errors.length > 0;
    
    if (hasFallbacks) {
      // Count successes and fallbacks
      const successes = result.results.filter(item => 
        item.success && item.source !== "fallback" && item.source !== "fallback_error"
      ).length;
      const failures = result.totalAttempted - successes;
      
      return res.json({
        success: true,
        data: result,
        partialFallback: true,
        message: `Synced ${result.totalAttempted} locations. ${successes} succeeded with real data, ${failures} used fallback data.`
      });
    }
    
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
// Property details endpoint (for testing)
testRouter.get("/property-details", async (req, res) => {
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
    
    // If the result contains an error property, it's a fallback response
    if (result.error) {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.message || "Used fallback data due to API error",
        error: result.error
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Property sale history endpoint (for testing)
testRouter.get("/property-history", async (req, res) => {
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
    
    // If the result contains an error property, it's a fallback response
    if (result.error) {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.message || "Used fallback data due to API error",
        error: result.error
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching property sale history:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Market statistics endpoint (for testing)
testRouter.get("/market-statistics", async (req, res) => {
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
    
    // If the result contains an error property, it's a fallback response
    if (result.error || result.isFallback) {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.message || "Used fallback data due to API error",
        error: result.error
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching market statistics:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Test endpoint for update-market-data
testRouter.post("/update-market-data", async (req, res) => {
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
    
    // Check if the result contains a source indicating it's fallback data
    if (result.source === "fallback" || result.source === "fallback_error") {
      return res.json({
        success: true,
        data: result,
        isFallback: true,
        message: result.error ? `Error: ${result.error}` : "Used fallback data due to API limitations"
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating market data:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Test endpoint for sync-market-data
testRouter.post("/sync-market-data", async (req, res) => {
  try {
    const { locations } = req.body;
    
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Missing or invalid locations parameter. Expected an array of {city, state, zipCode} objects." 
      });
    }
    
    const result = await syncMarketData(locations);
    
    // Check if any of the results contain fallback data
    const hasFallbacks = result.results.some(item => 
      item.source === "fallback" || item.source === "fallback_error"
    ) || result.errors.length > 0;
    
    if (hasFallbacks) {
      // Count successes and fallbacks
      const successes = result.results.filter(item => 
        item.success && item.source !== "fallback" && item.source !== "fallback_error"
      ).length;
      const failures = result.totalAttempted - successes;
      
      return res.json({
        success: true,
        data: result,
        partialFallback: true,
        message: `Synced ${result.totalAttempted} locations. ${successes} succeeded with real data, ${failures} used fallback data.`
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error syncing market data:", error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
});

// Export both routers
export { router, testRouter };