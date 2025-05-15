import { MarketData, Property } from "@shared/schema";
import OpenAI from "openai";

// Use OpenAI API for AI features
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY environment variable is not set. AI-powered features will not work correctly.");
}

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY 
});

/**
 * Helper function to extract JSON from text that might contain markdown formatting
 * 
 * @param text Text that might contain JSON (possibly wrapped in markdown)
 * @returns Parsed JSON object
 */
function extractJsonFromText(text: string): any {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Input is not a valid string');
    }
    
    // First attempt: direct parsing
    try {
      return JSON.parse(text);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from markdown
    }
    
    // Remove markdown code block formatting if present
    let jsonText = text;
    
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonText = jsonBlockMatch[1];
    } else {
      // Try to find JSON-like structure (starting with { and ending with })
      const jsonMatch = text.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1];
      }
    }
    
    // Remove any unexpected characters at the beginning or end
    jsonText = jsonText.trim();
    
    // Handle the case where string starts with a character that's not { or [
    const firstValidChar = jsonText.search(/[\{\[]/);
    if (firstValidChar > 0) {
      jsonText = jsonText.substring(firstValidChar);
    }
    
    // Handle the case where string doesn't end cleanly with } or ]
    const lastBracePos = jsonText.lastIndexOf('}');
    const lastBracketPos = jsonText.lastIndexOf(']');
    const lastValidChar = Math.max(lastBracePos, lastBracketPos);
    
    if (lastValidChar > 0 && lastValidChar < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastValidChar + 1);
    }
    
    // Try to parse the extracted JSON
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      throw new Error(`Failed to parse extracted JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error extracting JSON from text:', error);
    throw new Error(`Failed to extract JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to format market data for AI readability
 * @param marketData Array of market data records
 */
function formatMarketDataForAI(marketData: MarketData[]): string {
  if (!marketData || marketData.length === 0) {
    return "No market data available.";
  }
  
  // Sort data by year and month to ensure chronological order
  const sortedData = [...marketData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  // Create a formatted string representation
  let formattedData = "Historical Real Estate Market Data:\n\n";
  
  sortedData.forEach((data, index) => {
    formattedData += `Period ${index + 1}: ${data.year}-${data.month.toString().padStart(2, '0')}\n`;
    formattedData += `-----------------------------------------\n`;
    formattedData += `Location: ${data.city}, ${data.state}${data.zipCode ? ` (${data.zipCode})` : ''}\n`;
    formattedData += `Median Price: $${data.medianPrice.toLocaleString()}\n`;
    formattedData += `Active Listings: ${data.inventoryCount}\n`;
    formattedData += `Median Days on Market: ${data.daysOnMarket}\n`;
    formattedData += `Price Change (YoY): ${data.priceChangeYoY !== null ? data.priceChangeYoY.toFixed(2) + '%' : 'N/A'}\n`;
    formattedData += `Price Change (MoM): ${data.priceChangeMoM !== null ? data.priceChangeMoM.toFixed(2) + '%' : 'N/A'}\n`;
    formattedData += `Months of Inventory: ${data.monthsOfInventory !== null ? data.monthsOfInventory.toFixed(1) : 'N/A'}\n`;
    formattedData += `Sale-to-List Ratio: ${data.saleToListRatio !== null ? (data.saleToListRatio * 100).toFixed(1) + '%' : 'N/A'}\n`;
    
    if (index < sortedData.length - 1) {
      formattedData += `\n`;
    }
  });
  
  return formattedData;
}

/**
 * Generate predictive analytics for market data
 * @param marketData Array of historical market data records
 * @returns Object containing market predictions and analysis
 */
async function generateMarketPrediction(marketData: MarketData[]) {
  try {
    // Format the market data to be more readable for the AI
    const formattedData = formatMarketDataForAI(marketData);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert real estate market analyst. 
          Your task is to analyze historical real estate market data and generate predictions 
          and insights for future market conditions. Provide detailed, data-driven analysis 
          with specific numerical projections where possible. Focus on price trends, inventory changes, 
          days on market, and market balance (buyer's vs seller's market).`
        },
        {
          role: "user",
          content: `Analyze this historical real estate market data and provide predictions for the next 1-3 months:
          ${formattedData}
          
          Generate a comprehensive market prediction in JSON format with these fields:
          - projections (object with oneMonth, threeMonths, sixMonths properties, each containing projected medianPrice, inventory, daysOnMarket, priceChange values)
          - marketOutlook (string describing if it's a buyer's, seller's, or balanced market)
          - keyFindings (array of strings with key insights)
          - recommendedActions (object with buyers, sellers, investors arrays containing advice)
          - timeRange (object with start and end dates for the data analyzed)
          - confidenceScore (number from 0-1 indicating prediction confidence)`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      throw new Error('No content in OpenAI response');
    }

    // Extract JSON from the response
    const jsonContent = extractJsonFromText(response.choices[0].message.content);
    return jsonContent;
  } catch (error) {
    console.error("Error generating market prediction:", error);
    throw new Error(`Failed to generate market prediction: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate property recommendations based on user preferences
 * @param user User object
 * @param properties Available properties
 * @param preferences User preferences including saved searches and saved properties
 * @returns Property recommendations with reasoning
 */
async function generatePropertyRecommendations(user: any, properties: Property[], preferences: any) {
  try {
    // Format properties data for the AI
    const propertiesData = properties
      .filter(p => p.status === "Active") // Only consider active properties
      .map(p => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        squareFeet: p.squareFeet,
        propertyType: p.propertyType,
        yearBuilt: p.yearBuilt,
        description: p.description,
        status: p.status,
        hasBasement: p.hasBasement,
        hasGarage: p.hasGarage,
        garageSpaces: p.garageSpaces,
        lotSize: p.lotSize,
        pricePerSqft: p.pricePerSqft
      }));

    // Limit to 50 properties to avoid token limits
    const limitedProperties = propertiesData.slice(0, 50);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert real estate advisor specializing in property recommendations. 
          Your task is to analyze properties and user preferences to recommend the best matches.
          Provide detailed reasoning for each recommendation highlighting why the property is a good fit.`
        },
        {
          role: "user",
          content: `Based on these user preferences:
          ${JSON.stringify(preferences, null, 2)}
          
          Recommend 3-5 of the best properties from this list:
          ${JSON.stringify(limitedProperties, null, 2)}
          
          Generate recommendations as a JSON array where each recommendation object contains:
          - address
          - city
          - state
          - zipCode
          - price (as a number)
          - bedrooms (as a number)
          - bathrooms (as a number)
          - squareFeet (as a number)
          - propertyType
          - matchScore (percentage from 0-100)
          - reasonForRecommendation (a short paragraph explaining why this property matches the user's preferences)`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      throw new Error('No content in OpenAI response');
    }
    
    // Extract JSON from the response, which might contain markdown formatting
    const recommendations = extractJsonFromText(response.choices[0].message.content);
    
    // If recommendations is not an array, look for nested array structure
    const recommendationsArray = Array.isArray(recommendations) 
      ? recommendations 
      : recommendations.recommendations || recommendations.properties || [];
    
    // Add propertyId from original data and imageUrl placeholder
    const enhancedRecommendations = recommendationsArray.map((rec: any) => {
      // Find matching property by address to get the ID
      const matchingProperty = properties.find(p => 
        p.address.toLowerCase() === rec.address?.toLowerCase() &&
        p.city.toLowerCase() === rec.city?.toLowerCase()
      );
      
      return {
        ...rec,
        propertyId: matchingProperty?.id || null,
        imageUrl: matchingProperty?.mainImageUrl || '/assets/property-placeholder.jpg'
      };
    });
    
    return {
      recommendations: enhancedRecommendations,
      generatedAt: new Date().toISOString(),
      userId: user.id
    };
  } catch (error) {
    console.error("Error generating property recommendations:", error);
    throw new Error(`Failed to generate property recommendations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Detect anomalies in property data compared to market trends
 * @param properties Properties to analyze
 * @param marketData Market data for comparison
 * @returns Analysis of anomalies, opportunities, and risks
 */
async function detectAnomalies(properties: Property[], marketData: MarketData[]) {
  try {
    // Format properties data for the AI
    const propertiesData = properties.map(p => ({
      id: p.id,
      address: p.address,
      city: p.city,
      state: p.state,
      zipCode: p.zipCode,
      price: p.price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      squareFeet: p.squareFeet,
      propertyType: p.propertyType,
      yearBuilt: p.yearBuilt,
      daysOnMarket: p.daysOnMarket,
      pricePerSqft: p.pricePerSqft,
      lastSoldPrice: p.lastSoldPrice,
      lastSoldDate: p.lastSoldDate
    }));

    // Format market data for AI readability
    const formattedMarketData = formatMarketDataForAI(marketData);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert real estate analyst specializing in detecting anomalies, 
          fraud, and unusual patterns in property listings. Your task is to analyze properties 
          against market data to identify potential issues or opportunities.`
        },
        {
          role: "user",
          content: `Analyze these properties for anomalies:
          ${JSON.stringify(propertiesData, null, 2)}
          
          Using this market context:
          ${formattedMarketData}
          
          Generate an anomaly analysis in JSON format with these fields:
          - anomalies (array of objects, each with propertyId, anomalyType, description, severityScore from 0-100)
          - summary (string explaining the overall findings)
          - recommendations (array of strings with recommended actions)
          - dataQualityIssues (array of strings describing any data quality concerns)`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      throw new Error('No content in OpenAI response');
    }

    // Extract JSON from the response
    const jsonContent = extractJsonFromText(response.choices[0].message.content);
    return jsonContent;
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a comprehensive market report for a location
 * @param location The location (city, state) to generate a report for
 * @param marketData Historical market data for the location
 * @returns Detailed market report in markdown format
 */
async function generateMarketReport(location: string, marketData: MarketData[]) {
  try {
    // Format market data for AI readability
    const formattedMarketData = formatMarketDataForAI(marketData);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are a professional real estate market analyst creating a comprehensive market report. 
          Provide factual, data-driven analysis with specific metrics, trends, and actionable insights.`
        },
        {
          role: "user",
          content: `Generate a comprehensive real estate market report for ${location} based on this historical data:
          
          ${formattedMarketData}
          
          Create a detailed report with these sections:
          1. Executive Summary
          2. Market Overview
          3. Price Analysis & Trends
          4. Inventory & Supply Analysis
          5. Days on Market Analysis
          6. Market Balance (Buyer's vs Seller's Market)
          7. Predictions for Next 3-6 Months
          8. Recommendations for Buyers
          9. Recommendations for Sellers
          10. Recommendations for Investors
          
          Format the report in markdown with clear headings, bullet points, and include key metrics.
          Make it professional, detailed, and data-driven with specific numbers where possible.`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      throw new Error('No content in OpenAI response');
    }

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating market report:", error);
    throw new Error(`Failed to generate market report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Group related functions into a service object
export const aiService = {
  generateMarketPrediction,
  generatePropertyRecommendations,
  detectAnomalies,
  generateMarketReport
};

// Helper functions for formatting data for charts and visualization
export function formatMarketDataForCharts(marketData: MarketData[]) {
  if (!marketData || marketData.length === 0) {
    return {
      labels: [],
      prices: [],
      inventory: [],
      daysOnMarket: [],
      priceChanges: []
    };
  }
  
  // Sort data chronologically
  const sortedData = [...marketData].sort((a, b) => {
    if (a.year !== b.year) return (a.year || 0) - (b.year || 0);
    return (a.month || 0) - (b.month || 0);
  });
  
  // Format month names for labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    labels: sortedData.map(data => `${monthNames[(data.month || 1) - 1]} ${data.year}`),
    prices: sortedData.map(data => data.medianPrice),
    inventory: sortedData.map(data => data.inventoryCount),
    daysOnMarket: sortedData.map(data => data.daysOnMarket),
    priceChanges: sortedData.map(data => data.priceChangeYoY || 0)
  };
}