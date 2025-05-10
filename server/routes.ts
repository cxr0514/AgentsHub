import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertPropertySchema, 
  insertSavedSearchSchema, 
  insertSavedPropertySchema,
  insertReportSchema
} from "../shared/schema";
import { searchProperties, getPropertyDetails, getMarketData, synchronizeMLSData } from "./services/integrationService";
import { testDatabaseConnection } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Properties routes
  apiRouter.get("/properties", async (req, res) => {
    try {
      let properties;
      
      if (Object.keys(req.query).length > 0) {
        const filters = {
          location: req.query.location as string | undefined,
          propertyType: req.query.propertyType as string | undefined,
          minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
          maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
          minBeds: req.query.minBeds ? parseInt(req.query.minBeds as string) : undefined,
          minBaths: req.query.minBaths ? parseInt(req.query.minBaths as string) : undefined,
          minSqft: req.query.minSqft ? parseInt(req.query.minSqft as string) : undefined,
          maxSqft: req.query.maxSqft ? parseInt(req.query.maxSqft as string) : undefined,
          status: req.query.status as string | undefined,
          yearBuilt: req.query.yearBuilt ? parseInt(req.query.yearBuilt as string) : undefined,
        };
        
        // Use integrated search that combines local DB and MLS data
        properties = await searchProperties(filters);
      } else {
        // If no filters, still use the integration service but with empty filters
        properties = await searchProperties({});
      }
      
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  apiRouter.get("/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Use integrated property details that combines local and MLS data
      const property = await getPropertyDetails(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property details" });
    }
  });

  apiRouter.post("/properties", async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  apiRouter.put("/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const propertyData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(id, propertyData);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // Property history routes
  apiRouter.get("/properties/:id/history", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const history = await storage.getPropertyHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching property history:", error);
      res.status(500).json({ message: "Failed to fetch property history" });
    }
  });

  // Market data routes
  apiRouter.get("/market-data", async (req, res) => {
    try {
      const { city, state, zipCode } = req.query;
      
      if (!city || !state) {
        return res.status(400).json({ message: "City and state are required" });
      }
      
      // Use integrated market data service that combines local and MLS data
      const marketData = await getMarketData(
        city as string, 
        state as string, 
        zipCode as string | undefined
      );
      
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // User routes
  apiRouter.post("/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Saved searches routes
  apiRouter.get("/users/:userId/saved-searches", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const savedSearches = await storage.getSavedSearchesByUser(userId);
      res.json(savedSearches);
    } catch (error) {
      console.error("Error fetching saved searches:", error);
      res.status(500).json({ message: "Failed to fetch saved searches" });
    }
  });

  apiRouter.post("/saved-searches", async (req, res) => {
    try {
      const searchData = insertSavedSearchSchema.parse(req.body);
      const savedSearch = await storage.createSavedSearch(searchData);
      res.status(201).json(savedSearch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search data", errors: error.errors });
      }
      console.error("Error creating saved search:", error);
      res.status(500).json({ message: "Failed to save search" });
    }
  });

  apiRouter.delete("/saved-searches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid saved search ID" });
      }
      
      const success = await storage.deleteSavedSearch(id);
      
      if (!success) {
        return res.status(404).json({ message: "Saved search not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting saved search:", error);
      res.status(500).json({ message: "Failed to delete saved search" });
    }
  });

  // Saved properties routes
  apiRouter.get("/users/:userId/saved-properties", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const savedProperties = await storage.getSavedPropertiesByUser(userId);
      
      // Get the full property details for each saved property
      const savedPropertiesWithDetails = await Promise.all(
        savedProperties.map(async (savedProperty) => {
          const property = await storage.getProperty(savedProperty.propertyId);
          return {
            ...savedProperty,
            property
          };
        })
      );
      
      res.json(savedPropertiesWithDetails);
    } catch (error) {
      console.error("Error fetching saved properties:", error);
      res.status(500).json({ message: "Failed to fetch saved properties" });
    }
  });

  apiRouter.post("/saved-properties", async (req, res) => {
    try {
      const propertyData = insertSavedPropertySchema.parse(req.body);
      const savedProperty = await storage.createSavedProperty(propertyData);
      res.status(201).json(savedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid saved property data", errors: error.errors });
      }
      console.error("Error saving property:", error);
      res.status(500).json({ message: "Failed to save property" });
    }
  });

  apiRouter.delete("/saved-properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid saved property ID" });
      }
      
      const success = await storage.deleteSavedProperty(id);
      
      if (!success) {
        return res.status(404).json({ message: "Saved property not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing saved property:", error);
      res.status(500).json({ message: "Failed to remove saved property" });
    }
  });

  // Database status endpoint
  apiRouter.get("/system/db-status", async (req, res) => {
    try {
      const status = await testDatabaseConnection();
      res.json(status);
    } catch (error) {
      console.error("Error checking database status:", error);
      res.status(500).json({ 
        connected: false,
        error: error instanceof Error ? error.message : "Unknown database error"
      });
    }
  });

  // MLS data synchronization route
  apiRouter.post("/mls/sync", async (req, res) => {
    try {
      // Check for optional limit parameter
      const limit = req.body.limit ? parseInt(req.body.limit) : 100;
      
      // Trigger MLS data synchronization
      const result = await synchronizeMLSData(limit);
      
      res.json(result);
    } catch (error) {
      console.error("Error synchronizing MLS data:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to synchronize MLS data"
      });
    }
  });

  // Reports routes
  apiRouter.get("/users/:userId/reports", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const reports = await storage.getReportsByUser(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  apiRouter.get("/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      const report = await storage.getReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Get the full property details for each property in the report
      const propertyIds = JSON.parse(report.properties as string);
      const properties = await Promise.all(
        propertyIds.map(async (propertyId: number) => {
          return await storage.getProperty(propertyId);
        })
      );
      
      res.json({
        ...report,
        properties
      });
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report details" });
    }
  });

  apiRouter.post("/reports", async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  apiRouter.delete("/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      const success = await storage.deleteReport(id);
      
      if (!success) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
