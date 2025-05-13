import { db } from "../db";
import { marketData } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { Property, InsertProperty } from "../../shared/schema";

/**
 * Generate fallback market data for when API calls fail
 * @param city City name
 * @param state State abbreviation
 * @param zipCode Optional zip code
 * @returns Structured fallback data that mimics the API response format
 */
function getFallbackMarketData(city: string, state: string, zipCode?: string) {
  console.log(`⚠️ USING TEMPORARY FALLBACK DATA for ${city}, ${state}${zipCode ? `, ${zipCode}` : ''} - ATTOM API integration in progress`);
  
  // Return a structured response that matches the expected format
  return {
    status: { 
      code: 0, 
      success: true,
      message: "TEMPORARY FALLBACK DATA - ATTOM API integration in progress"
    },
    area: [
      {
        city: city,
        state: state,
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
}

// ATTOM API configuration - updated with better error handling
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_API_BASE_URL = "https://api.gateway.attomdata.com"; // Primary endpoint URL

// Updated ATTOM API Endpoints with latest paths
const ENDPOINTS = {
  // Property information endpoints
  PROPERTY_DETAILS: "/propertyapi/v1.0.0/property/detail",
  PROPERTY_EXPAND_DETAIL: "/propertyapi/v1.0.0/property/expandedprofile",
  PROPERTY_BASIC_DETAIL: "/propertyapi/v1.0.0/property/basicprofile",
  PROPERTY_SALE_HISTORY: "/propertyapi/v1.0.0/property/salehistory",
  PROPERTY_DETAIL_MGET: "/propertyapi/v1.0.0/property/detailmget",
  
  // Property valuation endpoints
  PROPERTY_VALUATION: "/propertyapi/v1.0.0/property/valuation",
  PROPERTY_AVMDETAIL: "/propertyapi/v1.0.0/property/avmdetail",
  
  // Property search endpoints
  PROPERTY_ADDRESS_SEARCH: "/propertyapi/v1.0.0/property/address",
  PROPERTY_ID_SEARCH: "/propertyapi/v1.0.0/property/id",
  PROPERTY_GEO_SEARCH: "/propertyapi/v1.0.0/property/geo",
  
  // Area information endpoints
  MARKET_STATS: "/propertyapi/v1.0.0/assessment/snapshot",
  MARKET_SNAPSHOT: "/propertyapi/v1.0.0/sale/snapshot",
  AREA_DETAIL: "/propertyapi/v1.0.0/area/full",
  AREA_SEARCH: "/propertyapi/v1.0.0/area/basic",
};

/**
 * Convert ATTOM property data to our application's property format
 * @param attomProperty Property data from ATTOM API
 * @returns Converted property data
 */
export function convertAttomPropertyToAppProperty(attomProperty: any): Property {
  // Extract address components
  const address = attomProperty.address || {};
  const location = {
    address: address.line1 || '',
    city: address.locality || '',
    state: address.countrySubd || '',
    zipCode: address.postal1 || ''
  };
  
  // Extract sale information
  const sale = attomProperty.sale || {};
  const price = sale.amount ? sale.amount.toString() : '0';
  
  // Extract building information
  const building = attomProperty.building || {};
  const bedrooms = parseInt(building.rooms?.bathstotal || '0', 10);
  const bathrooms = building.rooms?.bathstotal || '0';
  const squareFeet = building.size?.universalsize || '0';
  const yearBuilt = building.yearbuilt || new Date().getFullYear() - 10;

  // Extract lot information
  const lot = attomProperty.lot || {};
  const lotSize = lot.lotsize1 || '0';
  
  // Get property type - map ATTOM types to our types
  let propertyType = 'Single Family';
  if (attomProperty.summary && attomProperty.summary.proptype) {
    const attomType = attomProperty.summary.proptype;
    if (attomType.includes('CONDO')) propertyType = 'Condo';
    else if (attomType.includes('TOWN')) propertyType = 'Townhouse';
    else if (attomType.includes('MFR') || attomType.includes('MULTI')) propertyType = 'Multi-Family';
    else if (attomType.includes('LAND')) propertyType = 'Land';
  }
  
  // Extract images if available
  let images: string[] = [];
  if (attomProperty.utilities && attomProperty.utilities.photos) {
    images = attomProperty.utilities.photos
      .filter((photo: any) => photo.url)
      .map((photo: any) => photo.url);
  }
  
  // Extract features if available
  let features: string[] = [];
  if (building.rooms && building.rooms.roomtype) {
    if (Array.isArray(building.rooms.roomtype)) {
      features = building.rooms.roomtype;
    } else if (typeof building.rooms.roomtype === 'string') {
      features = [building.rooms.roomtype];
    }
  }
  
  // Calculate price per sqft
  const squareFeetNum = parseFloat(squareFeet);
  const priceNum = parseFloat(price);
  const pricePerSqft = squareFeetNum > 0 && priceNum > 0 
    ? (priceNum / squareFeetNum).toFixed(2)
    : '0';
  
  // Generate a description
  const description = `${propertyType} located in ${location.city}, ${location.state}. Built in ${yearBuilt}.`;
  
  // Return the converted property
  return {
    id: 0, // Will be assigned by database
    externalId: attomProperty.identifier?.attomId || null,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode,
    neighborhood: address.neighborhood || null,
    price,
    bedrooms: bedrooms || 0,
    bathrooms,
    squareFeet,
    lotSize,
    yearBuilt,
    propertyType,
    status: sale.saleTransDate ? 'Sold' : 'Active',
    daysOnMarket: 0, // Not directly available from ATTOM
    images: JSON.stringify(images) as any,
    pricePerSqft,
    description,
    features: JSON.stringify(features) as any,
    latitude: attomProperty.location?.latitude?.toString() || null,
    longitude: attomProperty.location?.longitude?.toString() || null,
    saleDate: sale.saleTransDate ? new Date(sale.saleTransDate) : null,
    hasBasement: false, // Not directly available from ATTOM
    hasGarage: false, // Set default values
    garageSpaces: 0, // Set default values
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Enhanced headers for ATTOM API requests
const getHeaders = () => {
  if (!ATTOM_API_KEY) {
    throw new Error("ATTOM API Key is not configured");
  }
  return {
    "apikey": ATTOM_API_KEY,           // API key header name is case-sensitive
    "Accept": "application/json",
    "Accept-Encoding": "gzip",         // Support compression
    "Accept-Language": "en-US,en;q=0.9"
  };
};

/**
 * Check ATTOM API key validity
 */
export async function checkAttomApiKey(): Promise<boolean> {
  if (!ATTOM_API_KEY) {
    console.error("ATTOM API Key is not configured");
    return false;
  }
  
  try {
    // Try to make a simple API call to check key validity
    const response = await fetch(`${ATTOM_API_BASE_URL}/propertyapi/v1.0.0/property/address?address1=123&address2=test`, {
      method: "GET",
      headers: getHeaders()
    });
    
    // We consider the key valid if we get any response (even an error),
    // as long as it's not a 401/403 which would indicate auth issues
    return response.status !== 401 && response.status !== 403;
  } catch (error) {
    console.error("Error checking ATTOM API key:", error);
    return false;
  }
}

/**
 * Enhanced function to fetch property details from ATTOM API
 * Adds pagination support and better error handling
 */
export async function fetchPropertyDetails(address: string, city: string, state: string, zipCode: string) {
  try {
    console.log(`Fetching property details for ${address}, ${city}, ${state} ${zipCode}`);
    
    // Check if API key is available
    if (!ATTOM_API_KEY) {
      console.warn("ATTOM API Key is not configured. Please add your ATTOM API key.");
      throw new Error("ATTOM API Key is not configured");
    }
    
    // Try multiple endpoints to get property details
    const endpoints = [
      ENDPOINTS.PROPERTY_ADDRESS_SEARCH, // Try address search first
      ENDPOINTS.PROPERTY_DETAILS,        // Then try property detail
      ENDPOINTS.PROPERTY_EXPAND_DETAIL,  // Then try expanded profile
      ENDPOINTS.PROPERTY_BASIC_DETAIL    // Finally try basic profile
    ];
    
    let response = null;
    let errorMessages: string[] = [];
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        const queryParams = new URLSearchParams();
        
        // Different parameters for different endpoints
        if (endpoint === ENDPOINTS.PROPERTY_ADDRESS_SEARCH) {
          // address search endpoint
          queryParams.append("address1", address);
          queryParams.append("address2", `${city}, ${state} ${zipCode}`);
          // Add pagination parameters
          queryParams.append("page", "1");
          queryParams.append("pagesize", "10");
        } else if (endpoint === ENDPOINTS.PROPERTY_DETAILS) {
          // detail endpoint
          queryParams.append("address1", address);
          queryParams.append("address2", `${city}, ${state} ${zipCode}`);
        } else if (endpoint === ENDPOINTS.PROPERTY_BASIC_DETAIL) {
          // basic profile endpoint
          queryParams.append("address1", address);
          queryParams.append("address2", `${city}, ${state} ${zipCode}`);
        } else if (endpoint === ENDPOINTS.PROPERTY_EXPAND_DETAIL) {
          // expanded profile endpoint
          queryParams.append("address1", address);
          queryParams.append("address2", `${city}, ${state} ${zipCode}`);
        }
        
        console.log(`Trying ATTOM API endpoint: ${endpoint} with params: ${queryParams.toString()}`);
        
        response = await fetch(`${ATTOM_API_BASE_URL}${endpoint}?${queryParams}`, {
          method: "GET",
          headers: getHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if we got a "SuccessWithoutResult" response (valid API call but no data)
          if (data?.status?.msg === "SuccessWithoutResult" || 
              (data?.property && data.property.length === 0)) {
            errorMessages.push(`Endpoint ${endpoint} returned no data for the query (SuccessWithoutResult)`);
            continue; // Try next endpoint
          }
          
          console.log(`Successfully retrieved data from ATTOM API using endpoint: ${endpoint}`);
          return data; // Return the successful data
        } else {
          const errorText = await response.text();
          const errorMessage = `ATTOM API Error: ${response.status} - ${errorText} [${endpoint}]`;
          errorMessages.push(errorMessage);
          console.warn(`Endpoint ${endpoint} failed: ${errorMessage}`);
        }
      } catch (endpointError: any) {
        const errorMessage = `Error with endpoint ${endpoint}: ${endpointError.message}`;
        errorMessages.push(errorMessage);
        console.warn(errorMessage);
      }
    }
    
    // If we get here, all endpoints failed
    console.warn("All ATTOM API endpoints failed:", errorMessages);
    
    // Return a clean message to the user with all error details
    return {
      property: {
        address: address,
        city: city,
        state: state,
        zipCode: zipCode || '',
        price: "Not available",
        bedrooms: 0,
        bathrooms: "0",
        squareFeet: "0",
        lotSize: "0",
        yearBuilt: 0,
        propertyType: "Unknown",
        description: "Property details not available from ATTOM API.",
        status: "Unknown",
        daysOnMarket: 0,
        lastSold: null,
        lastSoldPrice: null,
        taxAssessment: null,
        dataSources: ["API Connection Error"],
        message: "We're having trouble connecting to the property data service."
      },
      message: "Property details could not be retrieved from the property data service.",
      error: errorMessages.join("; ")
    };
  } catch (error: any) {
    console.error("Error fetching property details:", error);
    
    // Return clean user-facing error message
    return {
      property: {
        address: address,
        city: city,
        state: state,
        zipCode: zipCode || '',
        price: "Not available",
        bedrooms: 0,
        bathrooms: "0",
        squareFeet: "0",
        lotSize: "0",
        yearBuilt: 0,
        propertyType: "Unknown",
        description: "Property details not available due to a connection error.",
        status: "Unknown",
        daysOnMarket: 0,
        lastSold: null,
        lastSoldPrice: null,
        taxAssessment: null,
        dataSources: ["Connection Error"],
        message: "We're having trouble connecting to the property data service."
      },
      message: "An error occurred while fetching property details.",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Enhanced function to fetch market statistics for an area from ATTOM API
 * Adds pagination, better error handling, and supports different search methods
 */
export async function fetchMarketStatistics(city: string, state: string, zipCode?: string) {
  try {
    console.log(`Fetching market statistics for ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`);
    
    // Check if API key is available
    if (!ATTOM_API_KEY) {
      console.warn("ATTOM API Key is not configured. Please add your ATTOM API key.");
      throw new Error("ATTOM API Key is not configured");
    }
    
    // Enhanced approach to try multiple endpoints with better parameters
    const endpoints = [
      ENDPOINTS.MARKET_SNAPSHOT,   // Try sale snapshot first
      ENDPOINTS.MARKET_STATS,      // Then assessment snapshot
      ENDPOINTS.AREA_DETAIL,       // Then area details
      ENDPOINTS.AREA_SEARCH        // Finally area search
    ];
    
    let response = null;
    let errorMessages: string[] = [];
    
    // Try each endpoint with multiple search methods
    for (const endpoint of endpoints) {
      // Try multiple search strategies for each endpoint
      const searchMethods = ["address", "postalcode", "geo"];
      
      for (const searchMethod of searchMethods) {
        try {
          const queryParams = new URLSearchParams();
          
          if (endpoint === ENDPOINTS.MARKET_SNAPSHOT) {
            // Sale snapshot endpoint
            if (searchMethod === "address") {
              queryParams.append("address1", city);
              queryParams.append("address2", state);
            } else if (searchMethod === "postalcode" && zipCode) {
              queryParams.append("postalcode", zipCode);
            }
            
            // Required parameters for sale snapshot
            queryParams.append("minsaleamt", "100000");
            queryParams.append("maxsaleamt", "10000000");
            queryParams.append("propertytype", "SFR");
            
            // Add pagination parameters
            queryParams.append("page", "1"); 
            queryParams.append("pagesize", "50");
          } else if (endpoint === ENDPOINTS.MARKET_STATS) {
            // Assessment snapshot endpoint - use postal code or geoid
            if (searchMethod === "postalcode" && zipCode) {
              queryParams.append("postalcode", zipCode);
            } else if (searchMethod === "address") {
              queryParams.append("address1", city);
              queryParams.append("address2", state);
            }
          } else if (endpoint === ENDPOINTS.AREA_DETAIL || endpoint === ENDPOINTS.AREA_SEARCH) {
            // Area endpoints - try with postal code first, then city/state
            if (searchMethod === "postalcode" && zipCode) {
              queryParams.append("postalcode", zipCode);
            } else if (searchMethod === "address") {
              queryParams.append("areaname", city);
              queryParams.append("areastate", state);
            }
          }
          
          // Skip if no query parameters were added
          if (queryParams.toString() === "") {
            continue;
          }
          
          console.log(`Trying ATTOM API endpoint: ${endpoint} with params: ${queryParams.toString()}`);
          
          response = await fetch(`${ATTOM_API_BASE_URL}${endpoint}?${queryParams}`, {
            method: "GET",
            headers: getHeaders(),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Check if we got a "SuccessWithoutResult" response
            if (data?.status?.msg === "SuccessWithoutResult" || 
                (data?.property && data.property.length === 0)) {
              const errorMessage = `Endpoint ${endpoint} (${searchMethod}) returned no data (SuccessWithoutResult)`;
              errorMessages.push(errorMessage);
              console.warn(errorMessage);
              continue; // Try next search method
            }
            
            console.log(`Successfully retrieved market data from ATTOM API using endpoint: ${endpoint} (${searchMethod})`);
            return processAttomMarketData(data, city, state, zipCode);
          } else {
            const errorText = await response.text();
            const errorMessage = `ATTOM API Error: ${response.status} - ${errorText} [${endpoint}]`;
            errorMessages.push(errorMessage);
            console.warn(`Endpoint ${endpoint} (${searchMethod}) failed: ${errorMessage}`);
          }
        } catch (methodError: any) {
          const errorMessage = `Error with endpoint ${endpoint} (${searchMethod}): ${methodError.message}`;
          errorMessages.push(errorMessage);
          console.warn(errorMessage);
        }
      }
    }
    
    // If we get here, all endpoints and search methods failed
    console.warn("All ATTOM API endpoints failed. Using fallback data.");
    
    // Create fallback data with the proper structure
    const fallbackDataResponse = getFallbackMarketData(city, state, zipCode);
    
    // Process the fallback data just like real data
    return processAttomMarketData(fallbackDataResponse, city, state, zipCode);
  } catch (error: any) {
    console.error("Error fetching market data:", error);
    
    // Fallback to database if available
    try {
      // Construct the where conditions for the database query, handling zipCode properly
    // Query the database for existing market data
    const existingData = await db.select()
      .from(marketData)
      .where(
        and(
          eq(marketData.city, city),
          eq(marketData.state, state)
        )
      )
      .orderBy(marketData.createdAt, 'desc')
      .limit(1);
      
      if (existingData && existingData.length > 0) {
        console.log("Using existing market data from database");
        return { success: true, data: existingData[0], source: "database" };
      }
    } catch (dbError) {
      console.error("Error fetching existing market data from database:", dbError);
    }
    
    // If no existing data, return a clean error
    return { 
      success: false, 
      error: error.message,
      message: "We're having trouble connecting to the market data service. Please try again later."
    };
  }
}

/**
 * Process ATTOM market data from API response
 */
function processAttomMarketData(data: any, city: string, state: string, zipCode?: string) {
  try {
    // Extract relevant market data from the response
    const areaStats = data.property || [];
    
    // If no data, throw error to fall back to database
    if (!areaStats || areaStats.length === 0) {
      throw new Error("No market data available from ATTOM API");
    }
    
    // Process the data - calculate median price, etc.
    const prices = areaStats
      .filter((prop: any) => prop.sale && prop.sale.amount)
      .map((prop: any) => parseFloat(prop.sale.amount));
      
    // Calculate median price
    let medianPrice = "0";
    if (prices.length > 0) {
      prices.sort((a: number, b: number) => a - b);
      const midIndex = Math.floor(prices.length / 2);
      medianPrice = prices.length % 2 === 0
        ? ((prices[midIndex - 1] + prices[midIndex]) / 2).toString()
        : prices[midIndex].toString();
    }
    
    // Calculate days on market - average if available
    const daysOnMarket = areaStats
      .filter((prop: any) => prop.sale && prop.sale.marketingTime)
      .map((prop: any) => parseInt(prop.sale.marketingTime, 10));
      
    const avgDaysOnMarket = daysOnMarket.length > 0
      ? Math.round(daysOnMarket.reduce((sum: number, days: number) => sum + days, 0) / daysOnMarket.length)
      : 30; // Default value
    
    // Calculate price per sq ft - average if available
    const pricesPerSqFt = areaStats
      .filter((prop: any) => 
        prop.sale && prop.sale.amount && 
        prop.building && prop.building.size && prop.building.size.universalsize)
      .map((prop: any) => 
        parseFloat(prop.sale.amount) / parseFloat(prop.building.size.universalsize));
        
    const avgPricePerSqft = pricesPerSqFt.length > 0
      ? Math.round(pricesPerSqFt.reduce((sum: number, price: number) => sum + price, 0) / pricesPerSqFt.length)
      : 250; // Default value
    
    // Current date info for the record
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    // Create market data record
    const marketDataRecord = {
      city,
      state,
      zipCode: zipCode || "", // Use empty string instead of null to satisfy NOT NULL constraint
      month,
      year,
      medianPrice,
      daysOnMarket: avgDaysOnMarket,
      averagePricePerSqft: avgPricePerSqft,
      inventory: areaStats.length,
      activeListings: areaStats.filter((prop: any) => !prop.sale || !prop.sale.saleTransDate).length,
      soldListings: areaStats.filter((prop: any) => prop.sale && prop.sale.saleTransDate).length,
      medianDaysOnMarket: avgDaysOnMarket,
      inventoryMonths: 3, // Default value - not directly calculated
      createdAt: now
    };
    
    // Save to database
    db.insert(marketData).values([marketDataRecord])
      .catch(error => console.error("Error saving market data to database:", error));
    
    return { success: true, data: marketDataRecord, source: "api" };
  } catch (error: any) {
    console.error("Error processing ATTOM market data:", error);
    throw error; // Propagate the error to be handled by the caller
  }
}

export default {
  fetchPropertyDetails,
  fetchMarketStatistics,
  checkAttomApiKey,
  convertAttomPropertyToAppProperty
};