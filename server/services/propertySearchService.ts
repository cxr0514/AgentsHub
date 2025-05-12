/**
 * Property Search Service - Handles property search using ATTOM API
 * This service replaces the Datafiniti API with ATTOM API for property searches
 */
import { PropertyFilters } from '../storage';
import { Property } from '@shared/schema';
import { convertAttomPropertyToAppProperty } from './attomService';

// ATTOM API configuration
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_API_BASE_URL = "https://api.gateway.attomdata.com";

// ATTOM API Endpoints for property search
const SEARCH_ENDPOINTS = {
  ADDRESS_SEARCH: "/propertyapi/v1.0.0/property/address",
  DETAIL_SEARCH: "/propertyapi/v1.0.0/property/detail",
  GEO_SEARCH: "/propertyapi/v1.0.0/property/geo"
};

// Headers for ATTOM API requests
const getHeaders = () => {
  if (!ATTOM_API_KEY) {
    throw new Error("ATTOM API Key is not configured");
  }
  return {
    "apikey": ATTOM_API_KEY,
    "Accept": "application/json",
    "Accept-Encoding": "gzip"
  };
};

// Cache to reduce API calls
let propertyCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Search for properties using ATTOM API
 * @param filters Search filters
 * @returns Array of properties
 */
export async function searchPropertiesViaAttom(filters: PropertyFilters): Promise<Property[]> {
  try {
    // Create cache key from filters
    const cacheKey = JSON.stringify(filters);
    
    // Check cache before making API request
    const cachedData = propertyCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }
    
    // Determine which ATTOM endpoint to use based on filters
    let endpoint = SEARCH_ENDPOINTS.GEO_SEARCH;
    let params = new URLSearchParams();
    
    // Apply filters to query parameters
    if (filters.location) {
      // If we have a specific location, use address search
      endpoint = SEARCH_ENDPOINTS.ADDRESS_SEARCH;
      params.append('address', filters.location);
    } else if (filters.lat && filters.lng && filters.radius) {
      // If we have lat/lng and radius, use geo search
      endpoint = SEARCH_ENDPOINTS.GEO_SEARCH;
      params.append('latitude', filters.lat.toString());
      params.append('longitude', filters.lng.toString());
      params.append('radius', filters.radius.toString());
    } else if (filters.zipCode) {
      // If we have zipCode, use address search with postal code
      endpoint = SEARCH_ENDPOINTS.ADDRESS_SEARCH;
      params.append('postalcode', filters.zipCode);
    } else {
      // Default to geo search with a wide area
      // This is not ideal but provides some results
      endpoint = SEARCH_ENDPOINTS.GEO_SEARCH;
      // Default to Atlanta area if no location specified
      params.append('latitude', '33.749');
      params.append('longitude', '-84.388');
      params.append('radius', '20'); // 20 mile radius
    }
    
    // Additional filters
    if (filters.minPrice) {
      params.append('minSaleAmt', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params.append('maxSaleAmt', filters.maxPrice.toString());
    }
    if (filters.minBeds) {
      params.append('minBeds', filters.minBeds.toString());
    }
    if (filters.minBaths) {
      params.append('minBaths', filters.minBaths.toString());
    }
    // Add year built filter if provided and not 'any_year'
    if (filters.yearBuilt && filters.yearBuilt !== 'any_year') {
      params.append('minYearBuilt', filters.yearBuilt.toString());
      params.append('maxYearBuilt', filters.yearBuilt.toString());
    }
    if (filters.propertyType) {
      // Map our property types to ATTOM property types
      const propertyTypeMap: Record<string, string> = {
        'Single Family': 'SFR',
        'Condo': 'CONDO',
        'Townhouse': 'TOWNHOUSE',
        'Multi-Family': 'MFR',
        'Land': 'LAND'
      };
      
      const attomPropertyType = propertyTypeMap[filters.propertyType] || 'SFR';
      params.append('propertytype', attomPropertyType);
    }
    
    // Common parameters
    params.append('pagesize', '25'); // Number of results to return
    
    // Make the API request
    console.log(`Searching properties via ATTOM API: ${endpoint}?${params.toString()}`);
    const response = await fetch(`${ATTOM_API_BASE_URL}${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      // Try to get more error details
      const errorText = await response.text();
      console.error(`ATTOM API error (${response.status}): ${errorText}`);
      
      // Use fallback behavior for error cases
      return handleAttomSearchError(filters);
    }
    
    const data = await response.json();
    
    // ATTOM API response structure varies by endpoint, but typically:
    // { status: {...}, property: [{...}] }
    if (!data.property || !Array.isArray(data.property)) {
      console.warn('Unexpected ATTOM API response format or no properties found');
      return handleAttomSearchError(filters);
    }
    
    // Convert ATTOM properties to our app format
    const properties = data.property.map(convertAttomPropertyToAppProperty);
    
    // Cache the results
    propertyCache.set(cacheKey, {
      data: properties,
      timestamp: Date.now()
    });
    
    return properties;
  } catch (error) {
    console.error('Error searching properties via ATTOM API:', error);
    return handleAttomSearchError(filters);
  }
}

/**
 * Handle error case in ATTOM property search
 * @param filters Original search filters
 * @returns Empty array (no fake data is provided)
 */
function handleAttomSearchError(filters: PropertyFilters): Property[] {
  console.log('ATTOM property search failed, returning empty results');
  return [];
}

/**
 * Get detailed property information from ATTOM API
 * @param id Property ID (our internal ID)
 * @param attomId ATTOM property ID (if available)
 * @returns Property details or null
 */
export async function getPropertyDetailsViaAttom(
  id: number,
  attomId?: string
): Promise<Property | null> {
  try {
    if (!attomId) {
      console.warn('No ATTOM ID provided for property details lookup');
      return null;
    }
    
    // Check if we have this property details cached
    const cacheKey = `property_${attomId}`;
    const cachedData = propertyCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }
    
    // Use the detail endpoint with the ATTOM ID
    const endpoint = SEARCH_ENDPOINTS.DETAIL_SEARCH;
    const params = new URLSearchParams();
    params.append('attomid', attomId);
    
    console.log(`Fetching property details via ATTOM API: ${endpoint}?${params.toString()}`);
    const response = await fetch(`${ATTOM_API_BASE_URL}${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ATTOM API error (${response.status}): ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.property || !data.property[0]) {
      console.warn('No property details found in ATTOM API response');
      return null;
    }
    
    // Convert ATTOM property to our app format
    const property = convertAttomPropertyToAppProperty(data.property[0]);
    
    // Cache the result
    propertyCache.set(cacheKey, {
      data: property,
      timestamp: Date.now()
    });
    
    return property;
  } catch (error) {
    console.error('Error fetching property details via ATTOM API:', error);
    return null;
  }
}