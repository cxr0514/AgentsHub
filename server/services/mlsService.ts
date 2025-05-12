/**
 * MLS Service - Handles integration with real MLS data sources
 */
import { Property, InsertProperty } from '@shared/schema';
import { db } from '../db';
import { properties } from '@shared/schema';

// API response types for MLS data
interface MLSApiResponse {
  success: boolean;
  properties?: MLSProperty[];
  error?: string;
}

interface MLSProperty {
  mlsId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  lotSize: string;
  yearBuilt: number;
  propertyType: string;
  status: string;
  daysOnMarket: number;
  images: string[];
  description: string;
  features: string[];
  latitude: number;
  longitude: number;
  neighborhood?: string;
}

// Config object for MLS API settings
const MLS_CONFIG = {
  API_KEY: process.env.MLS_API_KEY || '',
  // We need to fix the endpoint to use the correct Datafiniti API structure
  // Current endpoint is set to /account, but we need the base URL
  API_ENDPOINT: 'https://api.datafiniti.co/v4',
  CACHE_DURATION: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Ensure we have the correct endpoint
const normalizedEndpoint = MLS_CONFIG.API_ENDPOINT.endsWith('/') 
  ? MLS_CONFIG.API_ENDPOINT.slice(0, -1) 
  : MLS_CONFIG.API_ENDPOINT;

/**
 * Build a Datafiniti query string from search parameters
 * @param params Search parameters to convert to Datafiniti query format
 * @returns Datafiniti query string
 */
function buildDatafinitiQuery(params: Record<string, any>): string {
  const queryParts: string[] = [];
  
  // Map our search params to Datafiniti query format
  if (params.city) {
    queryParts.push(`address.city:"${params.city}"`);
  }
  
  if (params.state) {
    queryParts.push(`address.state:"${params.state}"`);
  }
  
  if (params.zipCode) {
    queryParts.push(`address.postalCode:"${params.zipCode}"`);
  }
  
  if (params.propertyType) {
    queryParts.push(`type:"${params.propertyType}"`);
  }
  
  if (params.minPrice) {
    queryParts.push(`prices.amountMin:>=${params.minPrice}`);
  }
  
  if (params.maxPrice) {
    queryParts.push(`prices.amountMax:<=${params.maxPrice}`);
  }
  
  if (params.minBeds) {
    queryParts.push(`bedrooms:>=${params.minBeds}`);
  }
  
  if (params.minBaths) {
    queryParts.push(`bathrooms:>=${params.minBaths}`);
  }
  
  if (params.minSqft) {
    queryParts.push(`building.squareFootage:>=${params.minSqft}`);
  }
  
  if (params.status) {
    queryParts.push(`status:"${params.status}"`);
  }
  
  // Default query if nothing else specified
  if (queryParts.length === 0) {
    // Using 'keys:*' to get all properties as per Datafiniti examples
    queryParts.push('keys:*');
  }
  
  return queryParts.join(' AND ');
}

// Cache to reduce API calls
let propertyCache: Map<string, { data: any; timestamp: number }> = new Map();

/**
 * Convert MLS property data to our application's property format
 */
function convertMLSPropertyToAppProperty(mlsProperty: any): InsertProperty {
  // Check if this is a Datafiniti property format
  if (mlsProperty.id && mlsProperty.dateAdded) {
    // Datafiniti format - convert to our application format
    // Extract numeric values, handling the format properly
    let lotSizeValue = '0';
    if (mlsProperty.lotSizeValue) {
      // Extract just the numeric part if it contains units (like "0.243618 acs")
      const lotSizeMatch = String(mlsProperty.lotSizeValue).match(/^(\d+\.?\d*)/);
      lotSizeValue = lotSizeMatch ? lotSizeMatch[1] : '0';
    }
    
    return {
      address: mlsProperty.address || '',
      city: mlsProperty.city || '',
      state: mlsProperty.province || '',
      zipCode: mlsProperty.postalCode || '',
      neighborhood: mlsProperty.neighborhoods ? mlsProperty.neighborhoods[0] : null,
      price: mlsProperty.mostRecentPriceAmount ? String(mlsProperty.mostRecentPriceAmount) : '0',
      bedrooms: mlsProperty.numBedroom || 0,
      bathrooms: mlsProperty.numBathroom ? String(mlsProperty.numBathroom) : '0',
      squareFeet: mlsProperty.floorSizeValue ? String(mlsProperty.floorSizeValue) : '0',
      lotSize: lotSizeValue, // Using cleaned numeric value
      yearBuilt: mlsProperty.yearBuilt || new Date().getFullYear() - 10, // Default to 10 years old if not provided
      propertyType: mlsProperty.propertyType || 'Unknown',
      status: mlsProperty.mostRecentStatus || 'Unknown',
      daysOnMarket: 0, // Not directly provided in Datafiniti response
      images: JSON.stringify(mlsProperty.imageURLs || []),
      pricePerSqft: mlsProperty.floorSizeValue && mlsProperty.mostRecentPriceAmount 
        ? (mlsProperty.mostRecentPriceAmount / mlsProperty.floorSizeValue).toFixed(2)
        : '0',
      description: `${mlsProperty.propertyType || 'Property'} located in ${mlsProperty.city || 'Unknown City'}`,
      features: JSON.stringify(mlsProperty.people || []), // Use people data as features for now
      latitude: mlsProperty.latitude ? String(mlsProperty.latitude) : null,
      longitude: mlsProperty.longitude ? String(mlsProperty.longitude) : null,
      externalId: mlsProperty.id || null, // Store the Datafiniti ID
    };
  } else {
    // Original MLSProperty format
    return {
      address: mlsProperty.address,
      city: mlsProperty.city,
      state: mlsProperty.state,
      zipCode: mlsProperty.zipCode,
      neighborhood: mlsProperty.neighborhood || null,
      price: mlsProperty.price,
      bedrooms: mlsProperty.bedrooms,
      bathrooms: mlsProperty.bathrooms,
      squareFeet: mlsProperty.squareFeet,
      lotSize: mlsProperty.lotSize,
      yearBuilt: mlsProperty.yearBuilt,
      propertyType: mlsProperty.propertyType,
      status: mlsProperty.status,
      daysOnMarket: mlsProperty.daysOnMarket,
      images: JSON.stringify(mlsProperty.images),
      pricePerSqft: (Number(mlsProperty.price.replace(/,/g, '')) / Number(mlsProperty.squareFeet.replace(/,/g, ''))).toFixed(2),
      description: mlsProperty.description,
      features: JSON.stringify(mlsProperty.features),
      latitude: mlsProperty.latitude || null,
      longitude: mlsProperty.longitude || null,
      externalId: mlsProperty.id || null,
    };
  }
}

/**
 * Fetch properties from MLS API with optional search parameters
 */
async function fetchFromMLS(searchParams: Record<string, any> = {}): Promise<MLSApiResponse> {
  if (!MLS_CONFIG.API_KEY) {
    console.warn('MLS API key not configured. Using fallback data.');
    return { success: false, error: 'MLS_API_KEY not configured' };
  }

  // Create cache key from search parameters
  const cacheKey = JSON.stringify(searchParams);
  
  // Check cache before making API request
  const cachedData = propertyCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < MLS_CONFIG.CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    const queryParams = new URLSearchParams();
    
    // Add all search parameters to query
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    // For Datafiniti API, we need to use their search endpoint with JSON body
    // They use POST requests with a JSON body containing query parameters
    const requestData = {
      query: buildDatafinitiQuery(searchParams),
      format: "JSON",
      num_records: searchParams.limit || 10,
      download: false,
      view: "property_preview" // Using one of the allowed views from Datafiniti API response
    };
    
    console.log('Sending query to Datafiniti API:', JSON.stringify(requestData));
    
    // Based on Datafiniti Postman collection, the correct endpoint for property search is: /properties/search
    console.log(`Sending search request to: ${normalizedEndpoint}/properties/search`);
    
    const response = await fetch(`${normalizedEndpoint}/properties/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MLS_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      // Get more details about the error
      const errorText = await response.text();
      console.error('Datafiniti API error response:', errorText);
      throw new Error(`MLS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Datafiniti returns data in a different structure than our expected MLSApiResponse
    // Their format: { records: [{...property data}], num_found: number }
    const mlsResponse: MLSApiResponse = {
      success: true,
      properties: data.records || []
    };
    
    console.log(`Retrieved ${mlsResponse.properties?.length || 0} properties from Datafiniti API`);
    
    // Cache the result
    propertyCache.set(cacheKey, {
      data: mlsResponse,
      timestamp: Date.now()
    });
    
    return mlsResponse;
  } catch (error) {
    console.error('Error fetching from MLS API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Search for properties using MLS API
 */
export async function searchMLSProperties(filters: Record<string, any> = {}): Promise<Property[]> {
  // Convert our application filters to MLS API parameters
  const mlsParams: Record<string, any> = {};
  
  if (filters.location) {
    // Parse location which could be city, zip, etc.
    mlsParams.location = filters.location;
  }
  
  if (filters.propertyType) {
    mlsParams.propertyType = filters.propertyType;
  }
  
  if (filters.minPrice) {
    mlsParams.minPrice = filters.minPrice;
  }
  
  if (filters.maxPrice) {
    mlsParams.maxPrice = filters.maxPrice;
  }
  
  if (filters.minBeds) {
    mlsParams.minBedrooms = filters.minBeds;
  }
  
  if (filters.minBaths) {
    mlsParams.minBathrooms = filters.minBaths;
  }
  
  if (filters.minSqft) {
    mlsParams.minSquareFeet = filters.minSqft;
  }
  
  if (filters.maxSqft) {
    mlsParams.maxSquareFeet = filters.maxSqft;
  }
  
  if (filters.status) {
    mlsParams.status = filters.status;
  }
  
  if (filters.yearBuilt) {
    mlsParams.yearBuilt = filters.yearBuilt;
  }

  // Call MLS API 
  const response = await fetchFromMLS(mlsParams);
  
  if (!response.success || !response.properties) {
    console.error('Failed to fetch MLS properties:', response.error);
    return [];
  }
  
  // Process and store the properties in our database
  try {
    const propertiesData = response.properties.map(convertMLSPropertyToAppProperty);
    
    // Insert properties into database, skipping duplicates
    const insertedProperties = await db.insert(properties)
      .values(propertiesData)
      .onConflictDoUpdate({
        target: [properties.address, properties.city, properties.state, properties.zipCode],
        set: {
          price: sql`EXCLUDED.price`,
          status: sql`EXCLUDED.status`,
          daysOnMarket: sql`EXCLUDED.days_on_market`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();
    
    return insertedProperties;
  } catch (error) {
    console.error('Error storing MLS properties in database:', error);
    return [];
  }
}

/**
 * Get property details from MLS using property ID
 */
export async function getMLSPropertyDetails(propertyId: string): Promise<Property | null> {
  if (!MLS_CONFIG.API_KEY) {
    console.warn('MLS API key not configured. Unable to fetch property details.');
    return null;
  }
  
  try {
    // For Datafiniti, we'll use the search endpoint with an ID filter,
    // as it seems more reliable than the direct lookup endpoint
    console.log(`Fetching property with ID ${propertyId} from Datafiniti API`);
    
    const requestData = {
      query: `id:${propertyId}`,
      format: "JSON",
      num_records: 1,
      download: false,
      view: "property_preview" // Using the view that we confirmed works
    };
    
    const response = await fetch(`${normalizedEndpoint}/properties/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MLS_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      // Get more details about the error
      const errorText = await response.text();
      console.error('Datafiniti property details API error response:', errorText);
      throw new Error(`MLS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Datafiniti returns data in the format: { records: [{ property data }] }
    if (!data || !data.records || data.records.length === 0) {
      console.warn(`No property found with ID ${propertyId}`);
      return null;
    }
    
    // Get the property from the records array
    const mlsProperty = data.records[0];
    
    // Convert to app property format
    const propertyData = convertMLSPropertyToAppProperty(mlsProperty);
    
    // Insert or update in database
    const [insertedProperty] = await db.insert(properties)
      .values(propertyData)
      .onConflictDoUpdate({
        target: [properties.address, properties.city, properties.state, properties.zipCode],
        set: {
          price: sql`EXCLUDED.price`,
          status: sql`EXCLUDED.status`,
          daysOnMarket: sql`EXCLUDED.days_on_market`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();
    
    return insertedProperty;
  } catch (error) {
    console.error('Error fetching property details from MLS:', error);
    return null;
  }
}

/**
 * Function to clear the MLS data cache
 */
export function clearMLSCache(): void {
  propertyCache.clear();
  console.log('MLS property cache cleared');
}

/**
 * Function to refresh MLS data in the database
 */
export async function refreshMLSData(limit: number = 100): Promise<number> {
  // Clear cache to ensure fresh data
  clearMLSCache();
  
  try {
    const response = await fetchFromMLS({ limit });
    
    if (!response.success || !response.properties) {
      console.error('Failed to refresh MLS data:', response.error);
      return 0;
    }
    
    const propertiesData = response.properties.map(convertMLSPropertyToAppProperty);
    
    // Insert or update properties
    const insertedProperties = await db.insert(properties)
      .values(propertiesData)
      .onConflictDoUpdate({
        target: [properties.address, properties.city, properties.state, properties.zipCode],
        set: {
          price: sql`EXCLUDED.price`,
          status: sql`EXCLUDED.status`,
          daysOnMarket: sql`EXCLUDED.days_on_market`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();
    
    return insertedProperties.length;
  } catch (error) {
    console.error('Error refreshing MLS data:', error);
    return 0;
  }
}

// Import missing dependencies
import { sql } from 'drizzle-orm';