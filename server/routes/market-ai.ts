import { Request, Response } from "express";
import { storage } from "../storage";
import { aiService } from "../services/aiService";
import { z } from "zod";

// Validation schema for location-based requests
const locationParamsSchema = z.object({
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().optional(),
});

/**
 * Get AI-powered market predictions for a location
 */
export async function getMarketPredictions(req: Request, res: Response) {
  try {
    // Validate query parameters
    const validationResult = locationParamsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors });
    }

    const { city, state, zipCode } = validationResult.data;

    // Check if we have recent predictions for this location in storage
    const existingPredictions = await storage.getMarketPredictionsByLocation(
      city,
      state,
      zipCode
    );

    // If recent prediction exists (within last 7 days), return it
    const now = new Date();
    const recentPrediction = existingPredictions.find(pred => {
      const predDate = new Date(pred.predictionDate);
      const diffDays = Math.floor((now.getTime() - predDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays < 7;
    });

    if (recentPrediction) {
      return res.json(JSON.parse(recentPrediction.predictions.toString()));
    }

    // Otherwise, generate new prediction
    const marketData = await storage.getMarketDataByLocation(city, state, zipCode);
    
    // If no market data, return error
    if (marketData.length === 0) {
      return res.status(404).json({ 
        error: "No market data available for this location" 
      });
    }

    // Generate market prediction using Perplexity AI
    const prediction = await aiService.generateMarketPrediction(marketData);

    // Save prediction to storage
    await storage.createMarketPrediction({
      city,
      state,
      zipCode: zipCode || null,
      predictions: prediction,
      dataPoints: marketData.length,
      startDate: new Date(prediction.timeRange?.start),
      endDate: new Date(prediction.timeRange?.end),
      predictionDate: new Date(),
      generatedBy: "perplexity"
    });

    return res.json(prediction);
  } catch (error) {
    console.error("Error in market predictions:", error);
    return res.status(500).json({ 
      error: "Failed to generate market predictions",
      details: error.message
    });
  }
}

/**
 * Get personalized property recommendations for a user
 */
export async function getPropertyRecommendations(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Get user preferences from request body
    const preferences = req.body;
    
    // Get properties based on user preferences
    let properties = await storage.getPropertiesByFilters({
      minPrice: preferences.priceRange?.min,
      maxPrice: preferences.priceRange?.max,
      minBeds: preferences.bedrooms,
      maxBeds: preferences.bedrooms,
      propertyType: preferences.propertyTypes?.[0]
    });

    // If no properties, return error
    if (properties.length === 0) {
      return res.status(404).json({ 
        error: "No properties found matching your preferences" 
      });
    }

    // Generate recommendations using Perplexity AI
    const recommendations = await aiService.generatePropertyRecommendations(
      properties, 
      preferences
    );

    // Save recommendations to storage
    await storage.createPropertyRecommendation({
      userId,
      recommendations,
      preferences
    });

    return res.json(recommendations);
  } catch (error) {
    console.error("Error in property recommendations:", error);
    return res.status(500).json({ 
      error: "Failed to generate property recommendations",
      details: error.message
    });
  }
}

/**
 * Analyze property listings for anomalies
 */
export async function detectAnomalies(req: Request, res: Response) {
  try {
    const propertyIds = req.body.propertyIds;
    
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({ error: "Property IDs array is required" });
    }

    // Get properties by IDs
    const properties = await Promise.all(
      propertyIds.map(id => storage.getProperty(id))
    );

    // Filter out undefined properties
    const validProperties = properties.filter(p => p !== undefined);

    if (validProperties.length === 0) {
      return res.status(404).json({ error: "No valid properties found" });
    }

    // Get market data for comparison
    const marketData = await storage.getMarketDataByLocation(
      validProperties[0].city,
      validProperties[0].state
    );

    // Analyze properties for anomalies
    const anomalyResults = await aiService.detectPropertyAnomalies(
      validProperties,
      marketData
    );

    return res.json(anomalyResults);
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    return res.status(500).json({ 
      error: "Failed to detect anomalies",
      details: error.message
    });
  }
}

/**
 * Generate a comprehensive market report
 */
export async function generateAIMarketReport(req: Request, res: Response) {
  try {
    // Validate query parameters
    const validationResult = locationParamsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors });
    }

    const { city, state, zipCode } = validationResult.data;

    // Get market data for the location
    const marketData = await storage.getMarketDataByLocation(city, state, zipCode);
    
    if (marketData.length === 0) {
      return res.status(404).json({ 
        error: "No market data available for this location" 
      });
    }

    // Get recent sales and active listings
    const properties = await storage.getPropertiesByFilters({
      city,
      state,
      zipCode
    });

    // Generate comprehensive market report
    const marketReport = await aiService.generateMarketReport(
      marketData,
      properties
    );

    return res.json(marketReport);
  } catch (error) {
    console.error("Error generating market report:", error);
    return res.status(500).json({ 
      error: "Failed to generate market report",
      details: error.message
    });
  }
}