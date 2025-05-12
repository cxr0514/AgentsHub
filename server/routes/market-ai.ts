import { Request, Response } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { 
  marketData, 
  properties, 
  marketPredictions, 
  propertyRecommendations,
  savedSearches
} from "@shared/schema";
import { z } from "zod";
import { insertMarketPredictionsSchema, insertPropertyRecommendationsSchema } from "@shared/schema";
import { 
  predictMarketTrends, 
  generatePropertyRecommendations, 
  detectPropertyAnomalies, 
  generateMarketReport 
} from "../services/openaiService";

/**
 * Get AI-powered market predictions for a location
 */
export async function getMarketPredictions(req: Request, res: Response) {
  try {
    const city = req.query.city as string;
    const state = req.query.state as string;
    const zipCode = req.query.zipCode as string | undefined;
    
    if (!city || !state) {
      return res.status(400).json({ message: "City and state are required parameters" });
    }
    
    // Check if we have recent predictions (less than 7 days old)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let query = db.select().from(marketPredictions)
      .where(
        and(
          eq(marketPredictions.city, city),
          eq(marketPredictions.state, state)
        )
      )
      .orderBy(marketPredictions.predictionDate);
      
    if (zipCode) {
      query = query.where(eq(marketPredictions.zipCode, zipCode));
    }
    
    const existingPredictions = await query;
    const recentPrediction = existingPredictions.find(
      pred => new Date(pred.predictionDate) > sevenDaysAgo
    );
    
    // If we have a recent prediction, return it
    if (recentPrediction) {
      return res.json(recentPrediction);
    }
    
    // Otherwise, fetch market data to generate new predictions
    let marketDataQuery = db.select().from(marketData)
      .where(
        and(
          eq(marketData.city, city),
          eq(marketData.state, state)
        )
      );
      
    if (zipCode) {
      marketDataQuery = marketDataQuery.where(eq(marketData.zipCode, zipCode));
    }
    
    const marketDataPoints = await marketDataQuery;
    
    // If we don't have enough data points, return an error
    if (marketDataPoints.length < 3) {
      return res.status(400).json({ 
        message: "Not enough historical market data to generate predictions",
        dataPoints: marketDataPoints.length,
        requiredPoints: 3
      });
    }
    
    // Generate market predictions using OpenAI
    const predictions = await predictMarketTrends(
      marketDataPoints,
      { city, state, zipCode }
    );
    
    // Sort data to get time range
    const sortedData = [...marketDataPoints].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Save the predictions to the database
    const [storedPrediction] = await db.insert(marketPredictions).values({
      city,
      state,
      zipCode,
      predictions: predictions,
      dataPoints: marketDataPoints.length,
      startDate: sortedData[0]?.createdAt,
      endDate: sortedData[sortedData.length - 1]?.createdAt,
      generatedBy: "openai"
    }).returning();
    
    res.json(storedPrediction);
  } catch (error) {
    console.error("Error generating market predictions:", error);
    res.status(500).json({ 
      message: "Failed to generate market predictions",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Get personalized property recommendations for a user
 */
export async function getPropertyRecommendations(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const reqBody = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Get user's saved searches to understand preferences
    const savedSearches = await db.select().from(savedSearches)
      .where(eq(savedSearches.userId, userId));
    
    // Get property listings that match user's criteria
    let propertiesQuery = db.select().from(properties);
    
    // Apply filters from request if provided
    if (reqBody.priceRange) {
      propertiesQuery = propertiesQuery
        .where(req => and(
          req.gte(properties.price, reqBody.priceRange.min.toString()),
          req.lte(properties.price, reqBody.priceRange.max.toString())
        ));
    }
    
    if (reqBody.bedrooms) {
      propertiesQuery = propertiesQuery
        .where(req => req.gte(properties.bedrooms, reqBody.bedrooms));
    }
    
    // Get properties
    const availableProperties = await propertiesQuery;
    
    // Prepare user preferences from saved searches and explicit preferences
    const userPreferences = {
      priceRange: reqBody.priceRange,
      bedrooms: reqBody.bedrooms,
      propertyTypes: reqBody.propertyTypes,
      locations: reqBody.locations,
      mustHaveFeatures: reqBody.mustHaveFeatures,
      searchHistory: savedSearches.map(search => ({
        location: search.location,
        propertyType: search.propertyType
      }))
    };
    
    // Generate recommendations
    const recommendations = await generatePropertyRecommendations(
      availableProperties,
      userPreferences
    );
    
    // Save recommendations to the database
    const [storedRecommendations] = await db.insert(propertyRecommendations).values({
      userId,
      recommendations,
      preferences: userPreferences
    }).returning();
    
    res.json(storedRecommendations);
  } catch (error) {
    console.error("Error generating property recommendations:", error);
    res.status(500).json({ 
      message: "Failed to generate property recommendations",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Analyze property listings for anomalies
 */
export async function detectAnomalies(req: Request, res: Response) {
  try {
    // Get the properties to analyze
    const propertyIds = req.body.propertyIds;
    
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({ message: "Property IDs are required" });
    }
    
    // Get the properties
    const propertiesToAnalyze = await db.select().from(properties)
      .where(req => req.inArray(properties.id, propertyIds));
    
    if (propertiesToAnalyze.length === 0) {
      return res.status(404).json({ message: "No properties found with the provided IDs" });
    }
    
    // Get market data for context
    const cities = [...new Set(propertiesToAnalyze.map(p => p.city))];
    const states = [...new Set(propertiesToAnalyze.map(p => p.state))];
    
    const marketDataPoints = await db.select().from(marketData)
      .where(req => and(
        req.inArray(marketData.city, cities),
        req.inArray(marketData.state, states)
      ));
    
    // Analyze for anomalies
    const anomalies = await detectPropertyAnomalies(
      propertiesToAnalyze,
      marketDataPoints
    );
    
    res.json(anomalies);
  } catch (error) {
    console.error("Error detecting property anomalies:", error);
    res.status(500).json({ 
      message: "Failed to detect property anomalies",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Generate a comprehensive market report
 */
export async function generateAIMarketReport(req: Request, res: Response) {
  try {
    const city = req.query.city as string;
    const state = req.query.state as string;
    const zipCode = req.query.zipCode as string | undefined;
    
    if (!city || !state) {
      return res.status(400).json({ message: "City and state are required parameters" });
    }
    
    // Get market data
    let marketDataQuery = db.select().from(marketData)
      .where(
        and(
          eq(marketData.city, city),
          eq(marketData.state, state)
        )
      );
      
    if (zipCode) {
      marketDataQuery = marketDataQuery.where(eq(marketData.zipCode, zipCode));
    }
    
    const marketDataPoints = await marketDataQuery;
    
    // If we don't have enough data points, return an error
    if (marketDataPoints.length < 3) {
      return res.status(400).json({ 
        message: "Not enough historical market data to generate a report",
        dataPoints: marketDataPoints.length,
        requiredPoints: 3
      });
    }
    
    // Generate market report
    const report = await generateMarketReport(
      marketDataPoints,
      { city, state, zipCode }
    );
    
    res.json(report);
  } catch (error) {
    console.error("Error generating market report:", error);
    res.status(500).json({ 
      message: "Failed to generate market report",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}