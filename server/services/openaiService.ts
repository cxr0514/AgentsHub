import OpenAI from "openai";
import { MarketData, Property } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Predict future market trends based on historical data
 */
export async function predictMarketTrends(
  marketData: MarketData[],
  location: { city: string; state: string; zipCode?: string }
): Promise<any> {
  try {
    // Sort market data by year and month (newest first)
    const sortedData = [...marketData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Use recent data points (up to 12 months) for trend analysis
    const recentData = sortedData.slice(0, 12);
    
    // Prepare data for OpenAI analysis
    const dataForAnalysis = recentData.map(data => ({
      month: data.month,
      year: data.year,
      medianPrice: data.medianPrice,
      daysOnMarket: data.daysOnMarket,
      inventory: data.activeListings,
      pricePerSqft: data.averagePricePerSqft,
      saleToListRatio: data.saleToListRatio,
      inventoryMonths: data.inventoryMonths,
    }));

    // Create prompt for the model
    const prompt = `
      Based on the following real estate market data for ${location.city}, ${location.state}${location.zipCode ? ` (ZIP: ${location.zipCode})` : ''}, 
      predict market trends for the next 3 months. Focus on median home prices, inventory, days on market, and provide an overall market outlook.
      
      Market data (from newest to oldest):
      ${JSON.stringify(dataForAnalysis, null, 2)}
      
      Please format your response as a JSON object with the following structure:
      {
        "projections": {
          "oneMonth": { "medianPrice": number, "inventory": number, "daysOnMarket": number, "priceChange": number },
          "threeMonths": { "medianPrice": number, "inventory": number, "daysOnMarket": number, "priceChange": number }
        },
        "marketOutlook": string, // Summary of projected market conditions (buyer's/seller's market, etc.)
        "keyFindings": string[], // Array of 3-4 bullet points highlighting key insights
        "recommendedActions": {
          "buyers": string[], // 2-3 actionable recommendations for buyers
          "sellers": string[], // 2-3 actionable recommendations for sellers
          "investors": string[] // 2-3 actionable recommendations for investors
        }
      }
    `;

    // Call OpenAI API for market predictions
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a real estate market analysis expert. Analyze historical housing market data to provide accurate market projections, insights, and actionable recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5, // More deterministic output
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      ...result,
      locationInfo: {
        city: location.city,
        state: location.state,
        zipCode: location.zipCode || null
      },
      currentData: recentData[0] || null,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating market predictions:", error);
    throw new Error(`Failed to generate market predictions: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate personalized property recommendations based on user preferences
 */
export async function generatePropertyRecommendations(
  properties: Property[],
  userPreferences: {
    priceRange?: { min: number; max: number };
    bedrooms?: number;
    propertyTypes?: string[];
    locations?: string[];
    mustHaveFeatures?: string[];
    searchHistory?: { location: string; propertyType: string }[];
  }
): Promise<any> {
  try {
    // Create a prompt with user preferences and available properties
    const prompt = `
      Based on the following user preferences and available properties, recommend the top 5 properties that best match the user's criteria.
      
      User preferences:
      ${JSON.stringify(userPreferences, null, 2)}
      
      Available properties:
      ${JSON.stringify(properties.map(p => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        squareFeet: p.squareFeet,
        propertyType: p.propertyType,
        yearBuilt: p.yearBuilt,
        features: p.features
      })), null, 2)}
      
      For each recommended property, provide:
      1. The property ID
      2. A brief explanation of why it matches the user's preferences
      3. Highlight any special features that make it a good fit
      
      Please format your response as a JSON object with the following structure:
      {
        "recommendations": [
          {
            "propertyId": number,
            "matchScore": number, // 0-100 score of how well it matches
            "reasons": string[], // 2-3 reasons this property is a good match
            "highlightedFeatures": string[] // Key features to highlight
          }
        ],
        "insights": string, // Analysis of user preferences and search patterns
        "alternativeSuggestions": { // Suggest other criteria the user might want to consider
          "locations": string[], // 1-2 other locations they might like
          "propertyTypes": string[], // 1-2 other property types they might like
          "priceRanges": { min: number, max: number } // Alternative price range
        }
      }
    `;

    // Call OpenAI API for property recommendations
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a personalized real estate recommendation assistant. Your goal is to help users find properties that best match their preferences and needs, while also suggesting alternatives they might not have considered." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // More creative recommendations
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      ...result,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating property recommendations:", error);
    throw new Error(`Failed to generate property recommendations: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Detect anomalies or potential issues in property listings
 */
export async function detectPropertyAnomalies(properties: Property[], marketData: MarketData[]): Promise<any> {
  try {
    // Prepare market context data
    const marketContext = marketData.map(data => ({
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      medianPrice: data.medianPrice,
      averagePricePerSqft: data.averagePricePerSqft,
      month: data.month,
      year: data.year
    }));

    // Create prompt for anomaly detection
    const prompt = `
      Analyze the following property listings against market data to identify potential anomalies, 
      risks, or unusual patterns that might indicate issues such as mispricing, fraud, or data errors.
      
      Market context:
      ${JSON.stringify(marketContext, null, 2)}
      
      Properties to analyze:
      ${JSON.stringify(properties.map(p => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        squareFeet: p.squareFeet,
        pricePerSqft: p.pricePerSqft,
        propertyType: p.propertyType,
        status: p.status,
        daysOnMarket: p.daysOnMarket,
        yearBuilt: p.yearBuilt
      })), null, 2)}
      
      Please format your response as a JSON object with the following structure:
      {
        "anomalies": [
          {
            "propertyId": number,
            "anomalyType": string, // e.g., "Mispricing", "Data error", "Potential fraud", "Market outlier"
            "description": string, // Detailed explanation of the detected anomaly
            "confidenceScore": number, // 0-100 confidence in this being a true anomaly
            "recommendation": string // Suggested action to verify or address the anomaly
          }
        ],
        "marketInsights": string, // Overall insights about the analyzed properties in context
        "dataQualityScore": number // 0-100 score of overall data quality for analyzed properties
      }
    `;

    // Call OpenAI API for anomaly detection
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a real estate data analysis expert who specializes in detecting anomalies, mispricing, and potential fraud in property listings. You analyze properties in market context to identify unusual patterns that may indicate problems." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // More precise analysis
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      ...result,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error detecting property anomalies:", error);
    throw new Error(`Failed to detect property anomalies: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a comprehensive market analysis report for a specific location
 */
export async function generateMarketReport(
  marketData: MarketData[], 
  location: { city: string; state: string; zipCode?: string }
): Promise<any> {
  try {
    // Sort market data by year and month
    const sortedData = [...marketData].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Create prompt for report generation
    const prompt = `
      Generate a comprehensive real estate market analysis report for ${location.city}, ${location.state}${location.zipCode ? ` (ZIP: ${location.zipCode})` : ''}.
      
      Market data (chronological order):
      ${JSON.stringify(sortedData.map(data => ({
        month: data.month,
        year: data.year,
        medianPrice: data.medianPrice,
        daysOnMarket: data.daysOnMarket,
        inventory: data.activeListings,
        pricePerSqft: data.averagePricePerSqft,
        saleToListRatio: data.saleToListRatio,
        inventoryMonths: data.inventoryMonths,
        marketType: data.marketType
      })), null, 2)}
      
      Please format your response as a JSON object with the following structure:
      {
        "executiveSummary": string, // Brief overview of market conditions
        "marketTrends": {
          "pricesTrend": {
            "description": string,
            "annualChange": number, // Percentage
            "outlook": string // Brief future projection
          },
          "inventoryTrend": {
            "description": string,
            "annualChange": number, // Percentage
            "outlook": string
          },
          "daysOnMarketTrend": {
            "description": string,
            "annualChange": number, // Percentage
            "outlook": string
          }
        },
        "opportunityAnalysis": {
          "buyerOpportunities": string[], // 2-3 opportunities for buyers
          "sellerOpportunities": string[], // 2-3 opportunities for sellers
          "investorOpportunities": string[] // 2-3 opportunities for investors
        },
        "marketHealthIndicators": {
          "overall": string, // "Healthy", "Overheated", "Slow", etc.
          "affordability": string,
          "competitiveness": string,
          "stability": string
        },
        "localFactors": {
          "economicIndicators": string[], // Local economic factors affecting the market
          "demographicTrends": string[] // Key demographic insights
        },
        "conclusion": string // Final analysis and recommendations
      }
    `;

    // Call OpenAI API for market report generation
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a senior real estate market analyst who creates comprehensive, data-driven market reports. Your reports are concise yet insightful, and include both quantitative analysis and qualitative insights about local markets." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4, // Balanced between creativity and precision
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      ...result,
      locationInfo: {
        city: location.city,
        state: location.state,
        zipCode: location.zipCode || null
      },
      dataPoints: sortedData.length,
      timeRange: {
        start: sortedData[0] ? `${sortedData[0].month}/${sortedData[0].year}` : null,
        end: sortedData[sortedData.length - 1] ? `${sortedData[sortedData.length - 1].month}/${sortedData[sortedData.length - 1].year}` : null
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating market report:", error);
    throw new Error(`Failed to generate market report: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}