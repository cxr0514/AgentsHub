import OpenAI from "openai";
import { MarketData, Property } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
// do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate market predictions using OpenAI's API
 * @param marketData Historical market data for a location
 * @returns Object containing market predictions and analysis
 */
async function generateMarketPrediction(marketData: MarketData[]) {
  try {
    // Format the market data to be more readable for the AI
    const formattedData = formatMarketDataForAI(marketData);

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert real estate market analyst. 
          Your task is to analyze historical real estate market data and generate predictions 
          and insights for future market conditions. Provide detailed, data-driven analysis 
          with specific numerical projections where possible. Focus on price trends, inventory changes, 
          days on market, and market balance (buyer's vs seller's market).`,
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
          - confidenceScore (number from 0-1 indicating prediction confidence)`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const prediction = JSON.parse(response.choices[0].message.content);
    return prediction;
  } catch (error) {
    console.error("Error generating market prediction:", error);
    throw new Error(`Failed to generate market prediction: ${error.message}`);
  }
}

/**
 * Generate property recommendations based on user preferences
 * @param properties Available properties
 * @param preferences User preferences 
 * @returns Property recommendations with reasoning
 */
async function generatePropertyRecommendations(properties: Property[], preferences: any) {
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
      description: p.description,
      status: p.status
    }));

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert real estate advisor specializing in property recommendations. 
          Your task is to analyze properties and user preferences to recommend the best matches.
          Provide detailed reasoning for each recommendation highlighting why the property is a good fit.`,
        },
        {
          role: "user",
          content: `Based on these user preferences:
          ${JSON.stringify(preferences, null, 2)}
          
          Recommend the best properties from this list:
          ${JSON.stringify(propertiesData, null, 2)}
          
          Generate recommendations in JSON format with these fields:
          - topRecommendations (array of objects, each with propertyId, matchScore from 0-100, and reasons array)
          - alternativeOptions (array of objects with propertyId, matchScore, and reasons)
          - summary (string explaining the overall recommendation strategy)
          - keyConsiderations (array of strings with important factors to consider)`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const recommendations = JSON.parse(response.choices[0].message.content);
    return recommendations;
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

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert real estate analyst specializing in detecting anomalies, 
          fraud, and unusual patterns in property listings. Your task is to analyze properties 
          against market data to identify potential issues or opportunities.`,
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
          - dataQualityIssues (array of strings describing any data quality concerns)`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const anomalyResults = JSON.parse(response.choices[0].message.content);
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

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert real estate market analyst specializing in creating comprehensive 
          market reports. Your task is to analyze market data and property information to generate 
          a detailed report with insights, trends, and recommendations.`,
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
          - generatedAt (current date string in ISO format)`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const report = JSON.parse(response.choices[0].message.content);
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

export const openaiService = {
  generateMarketPrediction,
  generatePropertyRecommendations,
  detectPropertyAnomalies,
  generateMarketReport,
};