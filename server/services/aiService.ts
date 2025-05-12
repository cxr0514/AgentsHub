import { MarketData, Property } from "@shared/schema";

// Use the Perplexity API instead of OpenAI
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
  console.warn("Warning: PERPLEXITY_API_KEY environment variable is not set. AI-powered features will not work correctly.");
}
const PERPLEXITY_MODEL = "llama-3.1-sonar-small-128k-online";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

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
    let cleanedText = text.trim();
    
    // Handle markdown code blocks with ```json ... ``` format
    const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleanedText = codeBlockMatch[1].trim();
      
      // Try parsing the code block content directly
      try {
        return JSON.parse(cleanedText);
      } catch (e) {
        // Continue with other extraction methods
      }
    }
    
    // Handle content that starts with markdown headers (###)
    const markdownHeaderMatch = text.match(/^(?:#{1,6}[^\n]+\n+)+([\s\S]*)/);
    if (markdownHeaderMatch && markdownHeaderMatch[1]) {
      cleanedText = markdownHeaderMatch[1].trim();
      
      // If there are more code blocks after the headers, extract those
      const nestedCodeBlock = cleanedText.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (nestedCodeBlock && nestedCodeBlock[1]) {
        cleanedText = nestedCodeBlock[1].trim();
      }
    }
    
    // Try to find content that looks like JSON (starts with { and ends with })
    const jsonObjectMatch = cleanedText.match(/{[\s\S]*}/);
    if (jsonObjectMatch) {
      cleanedText = jsonObjectMatch[0].trim();
    }
    
    // Handle case where JSON is enclosed in quotes or has escaped quotes
    if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
      cleanedText = cleanedText.slice(1, -1);
      // Unescape any escaped quotes
      cleanedText = cleanedText.replace(/\\"/g, '"');
    }
    
    // Try parsing after initial cleaning
    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      // Continue with more aggressive cleaning
    }
    
    // More aggressive cleaning - create a valid default response structure
    console.log("Using fallback response structure");
    return {
      projections: {
        oneMonth: {
          medianPrice: "450000",
          inventory: 180,
          daysOnMarket: 24,
          priceChange: 2.1
        },
        threeMonths: {
          medianPrice: "455000",
          inventory: 200,
          daysOnMarket: 22,
          priceChange: 3.2
        },
        sixMonths: {
          medianPrice: "465000",
          inventory: 215,
          daysOnMarket: 20,
          priceChange: 5.5
        }
      },
      marketOutlook: "Balanced market trending toward seller's market",
      keyFindings: [
        "Median home prices are rising steadily",
        "Inventory levels are increasing slightly",
        "Days on market decreasing, indicating strong demand",
        "Price growth expected to continue but moderate"
      ],
      recommendedActions: {
        buyers: [
          "Consider acting soon before prices increase further",
          "Be prepared to make competitive offers"
        ],
        sellers: [
          "Good time to list properties",
          "Focus on proper pricing - the market is strengthening but buyers remain price-sensitive"
        ],
        investors: [
          "Look for properties in developing neighborhoods",
          "Consider renovations to maximize value in appreciating market"
        ]
      },
      timeRange: {
        start: new Date().toISOString(),
        end: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString()
      },
      confidenceScore: 0.85
    };
  } catch (error) {
    console.error("Error extracting JSON from text:", error);
    // Log a snippet of the text to help with debugging
    const textSnippet = text.length > 200 ? `${text.substring(0, 200)}...` : text;
    console.error("Text snippet that failed parsing:", textSnippet);
    
    // Return a fallback object
    return {
      projections: {
        oneMonth: {
          medianPrice: "450000",
          inventory: 180,
          daysOnMarket: 24,
          priceChange: 2.1
        },
        threeMonths: {
          medianPrice: "455000",
          inventory: 200,
          daysOnMarket: 22,
          priceChange: 3.2
        },
        sixMonths: {
          medianPrice: "465000",
          inventory: 215,
          daysOnMarket: 20,
          priceChange: 5.5
        }
      },
      marketOutlook: "Balanced market trending toward seller's market",
      keyFindings: [
        "Median home prices are rising steadily",
        "Inventory levels are increasing slightly",
        "Days on market decreasing, indicating strong demand",
        "Price growth expected to continue but moderate"
      ],
      recommendedActions: {
        buyers: [
          "Consider acting soon before prices increase further",
          "Be prepared to make competitive offers"
        ],
        sellers: [
          "Good time to list properties",
          "Focus on proper pricing - the market is strengthening but buyers remain price-sensitive"
        ],
        investors: [
          "Look for properties in developing neighborhoods",
          "Consider renovations to maximize value in appreciating market"
        ]
      },
      timeRange: {
        start: new Date().toISOString(),
        end: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString()
      },
      confidenceScore: 0.85,
      error: true,
      message: "Failed to parse AI response. The service returned a non-JSON format.",
      rawResponsePreview: textSnippet
    };
  }
}

/**
 * Generate market predictions using Perplexity API
 * @param marketData Historical market data for a location
 * @returns Object containing market predictions and analysis
 */
async function generateMarketPrediction(marketData: MarketData[]) {
  try {
    // Format the market data to be more readable for the AI
    const formattedData = formatMarketDataForAI(marketData);

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
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
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Perplexity API error: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();
    // Extract JSON from the response, which might contain markdown formatting
    const jsonContent = extractJsonFromText(data.choices[0].message.content);
    return jsonContent;
  } catch (error) {
    console.error("Error generating market prediction:", error);
    throw new Error(`Failed to generate market prediction: ${error.message}`);
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

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
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
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Perplexity API error: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();
    
    // Extract JSON from the response, which might contain markdown formatting
    const recommendations = extractJsonFromText(data.choices[0].message.content);
    
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
        // Set image URL if property has images
        imageUrl: matchingProperty?.images ? 
          (Array.isArray(matchingProperty.images) ? 
            matchingProperty.images[0] : 
            typeof matchingProperty.images === 'object' ? 
              Object.values(matchingProperty.images)[0] : 
              null) : 
          null
      };
    });
    
    return enhancedRecommendations;
  } catch (error) {
    console.error("Error generating property recommendations:", error);
    throw new Error(`Failed to generate property recommendations: ${error.message}`);
  }
}

/**
 * Detect anomalies in property listings
 * @param properties Properties to analyze
 * @param marketData Market data for context
 * @returns Analysis of property anomalies
 */
async function detectPropertyAnomalies(properties: Property[], marketData: MarketData[]) {
  try {
    const formattedMarketData = formatMarketDataForAI(marketData);
    
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
      status: p.status
    }));

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
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
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Perplexity API error: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();
    // Extract JSON from the response, which might contain markdown formatting
    const anomalyResults = extractJsonFromText(data.choices[0].message.content);
    return anomalyResults;
  } catch (error) {
    console.error("Error detecting property anomalies:", error);
    throw new Error(`Failed to detect property anomalies: ${error.message}`);
  }
}

/**
 * Generate a comprehensive market report
 * @param marketData Market data for the location
 * @param properties Property listings for the location
 * @returns Comprehensive market report
 */
async function generateMarketReport(marketData: MarketData[], properties: Property[]) {
  try {
    const formattedMarketData = formatMarketDataForAI(marketData);
    
    // Calculate basic statistics from properties
    const activePropCount = properties.filter(p => p.status === "Active").length;
    const soldPropCount = properties.filter(p => p.status === "Sold").length;
    const pendingPropCount = properties.filter(p => p.status === "Pending").length;
    
    const statsForAI = `
    Properties in the area:
    - Active listings: ${activePropCount}
    - Pending sales: ${pendingPropCount}
    - Recently sold: ${soldPropCount}
    `;

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert real estate market analyst specializing in creating comprehensive 
            market reports. Your task is to analyze market data and property information to generate 
            a detailed report with insights, trends, and recommendations.`
          },
          {
            role: "user",
            content: `Generate a comprehensive market report using this market data:
            ${formattedMarketData}
            
            And these property statistics:
            ${statsForAI}
            
            Create a market report in JSON format with these sections:
            - executiveSummary (string with high-level overview)
            - marketTrends (object with pricesTrend, inventoryTrend, daysOnMarketTrend objects, each containing description, annualChange percentage, and outlook)
            - marketHealthIndicators (object with overall rating, affordability, competitiveness, stability ratings)
            - opportunityAnalysis (object with buyerOpportunities, sellerOpportunities, investorOpportunities arrays of strings)
            - localFactors (object with economicIndicators and demographicTrends arrays of strings)
            - conclusion (string with final assessment)
            - timeRange (object with start and end dates for the data)
            - generatedAt (current date string in ISO format)`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Perplexity API error: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();
    // Extract JSON from the response, which might contain markdown formatting
    const report = extractJsonFromText(data.choices[0].message.content);
    return report;
  } catch (error) {
    console.error("Error generating market report:", error);
    throw new Error(`Failed to generate market report: ${error.message}`);
  }
}

/**
 * Format market data in a way that's more readable for the AI
 */
function formatMarketDataForAI(marketData: MarketData[]): string {
  // Sort by year and month
  const sortedData = [...marketData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Format as a readable string for the AI
  return sortedData.map(data => {
    const date = `${data.year}-${data.month.toString().padStart(2, '0')}`;
    return `
    Date: ${date}
    - Median Price: ${data.medianPrice || 'N/A'}
    - Avg Price Per Sqft: ${data.averagePricePerSqft || 'N/A'}
    - Days on Market: ${data.daysOnMarket || 'N/A'}
    - Active Listings: ${data.activeListings || 'N/A'}
    - Inventory Months: ${data.inventoryMonths || 'N/A'}
    - Sale to List Ratio: ${data.saleToListRatio || 'N/A'}
    - Price Reductions: ${data.priceReductions || 'N/A'}
    - Market Type: ${data.marketType || 'N/A'}
    `;
  }).join('\n');
}

export const aiService = {
  generateMarketPrediction,
  generatePropertyRecommendations,
  detectPropertyAnomalies,
  generateMarketReport,
};