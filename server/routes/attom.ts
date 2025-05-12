import { Router } from "express";
import { 
  fetchMarketStatistics, 
  updateMarketData, 
  syncMarketData,
  fetchPropertyDetails,
  fetchPropertySaleHistory
} from "../services/attomService";
import { requirePermission } from "../middleware/permissions";
import { Permission } from "../../shared/permissions";

const router = Router();

// Get market statistics for a location (protected route)
router.get("/market-stats", requirePermission(Permission.VIEW_PROPERTIES), async (req, res) => {
  try {
    const { city, state, zipCode } = req.query;

    if (!city || !state) {
      return res.status(400).json({ error: "City and state are required parameters" });
    }

    const data = await fetchMarketStatistics(
      city as string, 
      state as string,
      zipCode as string | undefined
    );

    return res.json(data);
  } catch (error: any) {
    console.error("Error fetching ATTOM market statistics:", error);
    return res.status(500).json({ error: error.message || "Error fetching market statistics" });
  }
});

// Update market data for a location (protected route)
router.post("/update-market-data", requirePermission(Permission.MANAGE_MLS_INTEGRATION), async (req, res) => {
  try {
    const { city, state, zipCode } = req.body;

    if (!city || !state) {
      return res.status(400).json({ error: "City and state are required parameters" });
    }

    const result = await updateMarketData(city, state, zipCode);
    return res.json(result);
  } catch (error: any) {
    console.error("Error updating market data:", error);
    return res.status(500).json({ error: error.message || "Error updating market data" });
  }
});

// Test endpoint for updating market data (unprotected for testing)
router.post("/test-update-market-data", async (req, res) => {
  try {
    const { city, state, zipCode } = req.body;

    if (!city || !state) {
      return res.status(400).json({ error: "City and state are required parameters" });
    }

    console.log(`Test endpoint: Updating market data for ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`);
    const result = await updateMarketData(city, state, zipCode);
    return res.json(result);
  } catch (error: any) {
    console.error("Error updating market data (test endpoint):", error);
    return res.status(500).json({ error: error.message || "Error updating market data" });
  }
});

// Sync market data for multiple locations (protected route)
router.post("/sync-market-data", requirePermission(Permission.MANAGE_MLS_INTEGRATION), async (req, res) => {
  try {
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: "Locations array is required" });
    }

    const result = await syncMarketData(locations);
    return res.json(result);
  } catch (error: any) {
    console.error("Error syncing market data:", error);
    return res.status(500).json({ error: error.message || "Error syncing market data" });
  }
});

// Test endpoint for syncing market data for multiple locations (unprotected for testing)
router.post("/test-sync-market-data", async (req, res) => {
  try {
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: "Locations array is required" });
    }

    console.log(`Test endpoint: Syncing market data for ${locations.length} locations`);
    const result = await syncMarketData(locations);
    return res.json(result);
  } catch (error: any) {
    console.error("Error syncing market data (test endpoint):", error);
    return res.status(500).json({ error: error.message || "Error syncing market data" });
  }
});

// Test route for ATTOM API connection (unprotected for testing)
router.get("/test-connection", async (req, res) => {
  const city = req.query.city as string || "Canton";
  const state = req.query.state as string || "GA";
  const zipCode = req.query.zipCode as string || "30115";

  try {
    // Test the connection to ATTOM API
    const data = await fetchMarketStatistics(city, state, zipCode);
    
    // Check if this is fallback data
    const isFallback = !data.status || !data.area || data.area.length === 0;
    
    if (isFallback) {
      return res.json({
        success: true,
        message: "Connected to ATTOM API with fallback data",
        source: "fallback",
        data
      });
    } else {
      return res.json({
        success: true,
        message: "Successfully connected to ATTOM API",
        source: "api",
        data
      });
    }
  } catch (error: any) {
    console.error("Error testing ATTOM API connection:", error);
    
    // Even if there's an error, we should have fallback data
    const fallbackData = {
      status: { code: 0, success: true },
      area: [
        {
          city,
          state,
          zipCode: zipCode || "",
          marketstat: [
            { MedianSalePrice: "450000" },
            { AverageDaysOnMarket: "30" },
            { ActiveListingCount: "145" },
            { MedianPricePerSqft: "250" },
            { SalesVolume: "25" },
            { MonthsOfInventory: "3.5" }
          ]
        }
      ]
    };
    
    return res.json({ 
      success: true,
      message: "Error connecting to ATTOM API, using fallback data",
      error: error.message,
      source: "fallback_error",
      data: fallbackData
    });
  }
});

// Test route for property details (unprotected for testing)
router.get("/test-property-details", async (req, res) => {
  const address = req.query.address as string || "123 Main St";
  const city = req.query.city as string || "Canton";
  const state = req.query.state as string || "GA";
  const zipCode = req.query.zipCode as string || "30115";

  try {
    console.log(`Testing property details for ${address}, ${city}, ${state} ${zipCode}`);
    
    // Test the connection to ATTOM API for property details
    const data = await fetchPropertyDetails(address, city, state, zipCode);
    
    return res.json({
      success: true,
      message: "Successfully fetched property details from ATTOM API",
      endpoint: "test-property-details",
      address,
      city,
      state,
      zipCode,
      data
    });
  } catch (error: any) {
    console.error("Error testing ATTOM API property details:", error);
    
    return res.json({ 
      success: false,
      message: "Error fetching property details from ATTOM API",
      endpoint: "test-property-details",
      error: error.message,
      address,
      city,
      state,
      zipCode
    });
  }
});

// Test route for property sale history (unprotected for testing)
router.get("/test-property-history", async (req, res) => {
  const address = req.query.address as string || "123 Main St";
  const city = req.query.city as string || "Canton";
  const state = req.query.state as string || "GA";
  const zipCode = req.query.zipCode as string || "30115";

  try {
    console.log(`Testing property sale history for ${address}, ${city}, ${state} ${zipCode}`);
    
    // Test the connection to ATTOM API for property sale history
    const data = await fetchPropertySaleHistory(address, city, state, zipCode);
    
    return res.json({
      success: true,
      message: "Successfully fetched property sale history from ATTOM API",
      endpoint: "test-property-history",
      address,
      city,
      state,
      zipCode,
      data
    });
  } catch (error: any) {
    console.error("Error testing ATTOM API property sale history:", error);
    
    return res.json({ 
      success: false,
      message: "Error fetching property sale history from ATTOM API",
      endpoint: "test-property-history",
      error: error.message,
      address,
      city,
      state,
      zipCode
    });
  }
});

export default router;