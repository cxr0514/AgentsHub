import { db } from "../db";
import { marketData } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

// ATTOM API configuration
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_API_BASE_URL = "https://api.gateway.attomdata.com";

// ATTOM API Endpoints
const ENDPOINTS = {
  PROPERTY_DETAILS: "/propertyapi/v1.0.0/property/detail",
  PROPERTY_VALUATION: "/propertyapi/v1.0.0/property/valuation",
  PROPERTY_SALE_HISTORY: "/propertyapi/v1.0.0/property/salehistory",
  MARKET_STATS: "/communityapi/v2.0.0/area/full",
  MARKET_VOLATILITY: "/propertyapi/v1.0.0/property/volatility",
};

// Headers for ATTOM API requests
const getHeaders = () => {
  if (!ATTOM_API_KEY) {
    throw new Error("ATTOM API Key is not configured");
  }
  return {
    "apikey": ATTOM_API_KEY,
    "Accept": "application/json",
  };
};

/**
 * Fetches property details from ATTOM API
 * @param address Property address
 * @param city Property city
 * @param state Property state
 * @param zipCode Property zip code
 */
export async function fetchPropertyDetails(address: string, city: string, state: string, zipCode: string) {
  try {
    console.log(`Fetching property details for ${address}, ${city}, ${state} ${zipCode}`);
    
    const queryParams = new URLSearchParams({
      address: address,
      city: city,
      state: state,
      zipcode: zipCode
    });
    
    const response = await fetch(`${ATTOM_API_BASE_URL}${ENDPOINTS.PROPERTY_DETAILS}?${queryParams}`, {
      method: "GET",
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ATTOM API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching property details:", error);
    throw error;
  }
}

/**
 * Fetches property sale history from ATTOM API
 * @param address Property address
 * @param city Property city
 * @param state Property state
 * @param zipCode Property zip code
 */
export async function fetchPropertySaleHistory(address: string, city: string, state: string, zipCode: string) {
  try {
    console.log(`Fetching property sale history for ${address}, ${city}, ${state} ${zipCode}`);
    
    const queryParams = new URLSearchParams({
      address: address,
      city: city,
      state: state,
      zipcode: zipCode
    });
    
    const response = await fetch(`${ATTOM_API_BASE_URL}${ENDPOINTS.PROPERTY_SALE_HISTORY}?${queryParams}`, {
      method: "GET",
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ATTOM API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching property sale history:", error);
    throw error;
  }
}

/**
 * Fetches market statistics for an area from ATTOM API
 * @param city City name
 * @param state State abbreviation
 * @param zipCode Zip code (optional)
 */
export async function fetchMarketStatistics(city: string, state: string, zipCode?: string) {
  try {
    console.log(`Fetching market statistics for ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`);
    
    const queryParams = new URLSearchParams();
    
    if (zipCode) {
      queryParams.append("postalcode", zipCode);
    } else {
      queryParams.append("city", city);
      queryParams.append("state", state);
    }
    
    const response = await fetch(`${ATTOM_API_BASE_URL}${ENDPOINTS.MARKET_STATS}?${queryParams}`, {
      method: "GET",
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ATTOM API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching market statistics:", error);
    throw error;
  }
}

/**
 * Processes and stores market data in the database
 * @param city City name
 * @param state State abbreviation
 * @param zipCode Zip code (optional)
 */
export async function updateMarketData(city: string, state: string, zipCode?: string) {
  try {
    console.log(`Updating market data for ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`);
    
    // Fetch data from ATTOM API
    const marketStats = await fetchMarketStatistics(city, state, zipCode);
    
    if (!marketStats || !marketStats.status || marketStats.status.code !== 0) {
      throw new Error(`Failed to fetch market data: ${JSON.stringify(marketStats.status || {})}`);
    }
    
    // Extract the relevant data from the API response
    const areaStats = marketStats.area ? marketStats.area[0] : null;
    
    if (!areaStats) {
      throw new Error("No area statistics available in the API response");
    }
    
    // Process and extract market metrics
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // 1-12
    const year = currentDate.getFullYear();
    
    // Extract market indicators from the API response
    const medianPrice = extractMetric(areaStats, "MedianSalePrice");
    const daysOnMarket = extractMetric(areaStats, "AverageDaysOnMarket");
    const activeListings = extractMetric(areaStats, "ActiveListingCount");
    const pricePerSqft = extractMetric(areaStats, "MedianPricePerSqft");
    const salesVolume = extractMetric(areaStats, "SalesVolume");
    const inventoryMonths = extractMetric(areaStats, "MonthsOfInventory");
    
    // Delete existing records for this location and time period
    await db.delete(marketData)
      .where(
        and(
          eq(marketData.city, city),
          eq(marketData.state, state),
          zipCode ? eq(marketData.zipCode, zipCode) : undefined,
          eq(marketData.month, month),
          eq(marketData.year, year)
        )
      );
    
    // Create a new market data record
    const newMarketData = {
      city,
      state,
      zipCode: zipCode || "",
      month,
      year,
      daysOnMarket: parseInt(daysOnMarket) || null,
      medianPrice: medianPrice || null,
      averagePricePerSqft: pricePerSqft || null,
      activeListings: parseInt(activeListings) || null,
      inventoryMonths: parseFloat(inventoryMonths) || null,
      saleToListRatio: 0.97, // Default if not available
      priceReductions: 10, // Default if not available
      marketType: determineMarketType(inventoryMonths),
      createdAt: new Date()
    };
    
    // Insert the new data
    await db.insert(marketData).values(newMarketData);
    
    console.log(`Successfully updated market data for ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`);
    return { success: true, data: newMarketData };
  } catch (error) {
    console.error("Error updating market data:", error);
    throw error;
  }
}

/**
 * Helper function to extract metrics from ATTOM API response
 */
function extractMetric(areaStats: any, metricName: string): string {
  try {
    if (areaStats.marketstat && Array.isArray(areaStats.marketstat)) {
      for (const stat of areaStats.marketstat) {
        if (stat.hasOwnProperty(metricName)) {
          return stat[metricName].toString();
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Error extracting ${metricName}:`, error);
    return null;
  }
}

/**
 * Determines market type based on months of inventory
 */
function determineMarketType(inventoryMonths: string): string {
  const months = parseFloat(inventoryMonths);
  if (isNaN(months)) return "Balanced";
  
  if (months < 3) return "Seller's Market";
  if (months > 6) return "Buyer's Market";
  return "Balanced";
}

/**
 * Synchronizes market data for multiple locations
 * @param locations Array of locations to update
 */
export async function syncMarketData(locations: Array<{city: string, state: string, zipCode?: string}>) {
  const results = [];
  const errors = [];
  
  for (const location of locations) {
    try {
      const result = await updateMarketData(location.city, location.state, location.zipCode);
      results.push({
        location,
        success: true,
        data: result
      });
    } catch (error) {
      console.error(`Error syncing market data for ${location.city}, ${location.state}:`, error);
      errors.push({
        location,
        success: false,
        error: error.message
      });
    }
  }
  
  return {
    results,
    errors,
    totalSuccess: results.length,
    totalErrors: errors.length
  };
}