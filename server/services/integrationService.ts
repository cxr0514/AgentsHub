/**
 * Integration Service - Manages synchronization between MLS data and local storage
 */
import { db } from '../db';
import { properties, marketData, Property } from '@shared/schema';
import { searchMLSProperties, refreshMLSData, getMLSPropertyDetails } from './mlsService';
import { searchPropertiesViaAttom, getPropertyDetailsViaAttom } from './propertySearchService';
import { PropertyFilters } from '../storage';
import { eq, and, gte, lte, like, or } from 'drizzle-orm';

/**
 * Synchronize local properties with MLS data
 * Refreshes the local database with the latest data from MLS
 */
export async function synchronizeMLSData(limit: number = 100): Promise<{
  status: string;
  message: string;
  count?: number;
}> {
  try {
    if (!process.env.MLS_API_KEY) {
      return {
        status: 'warning',
        message: 'MLS API key not configured. Synchronization skipped.'
      };
    }

    console.log('Starting MLS data synchronization...');
    const count = await refreshMLSData(limit);
    
    return {
      status: 'success',
      message: `Successfully synchronized ${count} properties from MLS`,
      count
    };
  } catch (error) {
    console.error('Error synchronizing MLS data:', error);
    return {
      status: 'error',
      message: `Failed to synchronize MLS data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Search for properties using MLS data and local database
 * First checks local database, then fetches from MLS if needed
 */
export async function searchProperties(filters: PropertyFilters = {}): Promise<any[]> {
  try {
    // First attempt to find matching properties in local database
    let query = db.select().from(properties);
    
    // Apply filters to query
    if (filters.location) {
      // Search in city, state, zipCode, and neighborhood
      const searchTerm = `%${filters.location}%`;
      query = query.where(
        or(
          like(properties.city, searchTerm),
          like(properties.state, searchTerm),
          like(properties.zipCode, searchTerm),
          like(properties.neighborhood, searchTerm)
        )
      );
    }
    
    if (filters.propertyType) {
      query = query.where(eq(properties.propertyType, filters.propertyType));
    }
    
    if (filters.minPrice) {
      query = query.where(gte(properties.price, filters.minPrice.toString()));
    }
    
    if (filters.maxPrice) {
      query = query.where(lte(properties.price, filters.maxPrice.toString()));
    }
    
    if (filters.minBeds) {
      query = query.where(gte(properties.bedrooms, filters.minBeds));
    }
    
    if (filters.minBaths) {
      query = query.where(gte(properties.bathrooms, filters.minBaths.toString()));
    }
    
    if (filters.minSqft) {
      query = query.where(gte(properties.squareFeet, filters.minSqft.toString()));
    }
    
    if (filters.maxSqft) {
      query = query.where(lte(properties.squareFeet, filters.maxSqft.toString()));
    }
    
    if (filters.status) {
      query = query.where(eq(properties.status, filters.status));
    }
    
    if (filters.yearBuilt) {
      // Skip the yearBuilt filter if it's set to "any_year"
      const yearBuiltStr = String(filters.yearBuilt);
      if (yearBuiltStr !== 'any_year') {
        // Parse to number if it's a string number
        const yearBuiltValue = 
          typeof filters.yearBuilt === 'string' && !isNaN(parseInt(filters.yearBuilt)) 
            ? parseInt(filters.yearBuilt) 
            : filters.yearBuilt;
        query = query.where(eq(properties.yearBuilt, yearBuiltValue));
      }
    }
    
    // Execute the query
    const rawProperties = await query;
    
    // Process the properties to properly handle jsonb fields
    const localProperties = rawProperties.map(property => {
      // For image processing
      let processedImages = property.images;
      if (processedImages) {
        if (typeof processedImages === 'string') {
          // Try to extract URLs using regex
          const urlRegex = /(https?:\/\/[^\s"]+)/g;
          const matches = processedImages.match(urlRegex);
          if (matches && matches.length > 0) {
            processedImages = matches;
          } else {
            // Try parsing as JSON if it looks like JSON
            try {
              if (processedImages.includes('[') && processedImages.includes(']')) {
                // Clean up extra quotes first
                const cleanedJSON = processedImages
                  .replace(/\"{3}/g, '"')
                  .replace(/\\"/g, '"');
                processedImages = JSON.parse(cleanedJSON);
              }
            } catch (e) {
              console.warn('Failed to parse images JSON:', e);
              processedImages = [];
            }
          }
        } else if (!Array.isArray(processedImages)) {
          // If it's not a string or array, set to empty array
          processedImages = [];
        }
      } else {
        processedImages = [];
      }
      
      // For features processing
      let processedFeatures = property.features;
      if (processedFeatures) {
        if (typeof processedFeatures === 'string') {
          // Try to extract features using regex for text patterns
          const wordPattern = /[a-zA-Z][a-zA-Z\s]+/g;
          const matches = processedFeatures.match(wordPattern);
          if (matches && matches.length > 0) {
            processedFeatures = matches.map(m => m.trim()).filter(Boolean);
          } else {
            // Try parsing as JSON if it looks like JSON
            try {
              if (processedFeatures.includes('[') && processedFeatures.includes(']')) {
                // Clean up extra quotes first
                const cleanedJSON = processedFeatures
                  .replace(/\"{3}/g, '"')
                  .replace(/\\"/g, '"');
                processedFeatures = JSON.parse(cleanedJSON);
              }
            } catch (e) {
              console.warn('Failed to parse features JSON:', e);
              processedFeatures = [];
            }
          }
        } else if (!Array.isArray(processedFeatures)) {
          // If it's not a string or array, set to empty array
          processedFeatures = [];
        }
      } else {
        processedFeatures = [];
      }
      
      return {
        ...property,
        images: processedImages,
        features: processedFeatures
      };
    });
    
    // If we have enough local results and no specific search criteria, return local results
    if (localProperties.length >= 20 && !filters.location && !filters.zipCode) {
      return localProperties;
    }
    
    // Fetch additional properties from ATTOM API
    console.log('Fetching additional properties from ATTOM API...');
    let attomProperties: Property[] = [];
    
    try {
      // First try ATTOM API if the key is available
      if (process.env.ATTOM_API_KEY) {
        attomProperties = await searchPropertiesViaAttom(filters);
      } 
      // Fallback to MLS/Datafiniti API if ATTOM fails or isn't configured
      else if (process.env.MLS_API_KEY) {
        console.log('ATTOM API key not configured, falling back to MLS API...');
        attomProperties = await searchMLSProperties(filters);
      }
    } catch (error) {
      console.error('Error fetching from external API:', error);
      // Continue with local results if external API fails
    }
    
    // Combine local and API properties, removing duplicates
    const combinedProperties = [...localProperties];
    const localAddresses = new Set(localProperties.map(p => 
      `${p.address}-${p.city}-${p.state}-${p.zipCode}`
    ));
    
    for (const apiProperty of attomProperties) {
      const addressKey = `${apiProperty.address}-${apiProperty.city}-${apiProperty.state}-${apiProperty.zipCode}`;
      if (!localAddresses.has(addressKey)) {
        combinedProperties.push(apiProperty);
      }
    }
    
    return combinedProperties;
  } catch (error) {
    console.error('Error in integrated property search:', error);
    
    // Fallback to just local database if MLS search fails
    let query = db.select().from(properties);
    
    // Apply basic filters
    if (filters.minPrice) {
      query = query.where(gte(properties.price, filters.minPrice.toString()));
    }
    
    if (filters.maxPrice) {
      query = query.where(lte(properties.price, filters.maxPrice.toString()));
    }
    
    if (filters.minBeds) {
      query = query.where(gte(properties.bedrooms, filters.minBeds));
    }
    
    return await query;
  }
}

/**
 * Get detailed property information, combining local and MLS data
 */
export async function getPropertyDetails(id: number): Promise<any | null> {
  try {
    // First check local database
    const [rawProperty] = await db.select().from(properties).where(eq(properties.id, id));
    
    if (rawProperty) {
      // Process the property to handle jsonb fields
      let processedProperty = { ...rawProperty };

      // For image processing
      let processedImages = rawProperty.images;
      if (processedImages) {
        if (typeof processedImages === 'string') {
          // Try to extract URLs using regex
          const urlRegex = /(https?:\/\/[^\s"]+)/g;
          const matches = processedImages.match(urlRegex);
          if (matches && matches.length > 0) {
            processedImages = matches;
          } else {
            // Try parsing as JSON if it looks like JSON
            try {
              if (processedImages.includes('[') && processedImages.includes(']')) {
                // Clean up extra quotes first
                const cleanedJSON = processedImages
                  .replace(/\"{3}/g, '"')
                  .replace(/\\"/g, '"');
                processedImages = JSON.parse(cleanedJSON);
              }
            } catch (e) {
              console.warn('Failed to parse images JSON:', e);
              processedImages = [];
            }
          }
        } else if (!Array.isArray(processedImages)) {
          // If it's not a string or array, set to empty array
          processedImages = [];
        }
      } else {
        processedImages = [];
      }
      
      // For features processing
      let processedFeatures = rawProperty.features;
      if (processedFeatures) {
        if (typeof processedFeatures === 'string') {
          // Try to extract features using regex for text patterns
          const wordPattern = /[a-zA-Z][a-zA-Z\s]+/g;
          const matches = processedFeatures.match(wordPattern);
          if (matches && matches.length > 0) {
            processedFeatures = matches.map(m => m.trim()).filter(Boolean);
          } else {
            // Try parsing as JSON if it looks like JSON
            try {
              if (processedFeatures.includes('[') && processedFeatures.includes(']')) {
                // Clean up extra quotes first
                const cleanedJSON = processedFeatures
                  .replace(/\"{3}/g, '"')
                  .replace(/\\"/g, '"');
                processedFeatures = JSON.parse(cleanedJSON);
              }
            } catch (e) {
              console.warn('Failed to parse features JSON:', e);
              processedFeatures = [];
            }
          }
        } else if (!Array.isArray(processedFeatures)) {
          // If it's not a string or array, set to empty array
          processedFeatures = [];
        }
      } else {
        processedFeatures = [];
      }
      
      processedProperty = {
        ...processedProperty,
        images: processedImages,
        features: processedFeatures
      };
      
      // If we have complete data, return processed local property
      if (processedProperty.description && processedProperty.images.length > 0) {
        return processedProperty;
      }
      
      // Try to get more detailed data from APIs
      try {
        // First try ATTOM API if the key is available
        if (process.env.ATTOM_API_KEY) {
          const attomProperty = await getPropertyDetailsViaAttom(id, processedProperty.externalId || undefined);
          if (attomProperty) {
            return attomProperty;
          }
        }
        // Fallback to MLS/Datafiniti API if ATTOM fails or isn't configured
        else if (process.env.MLS_API_KEY) {
          console.log('ATTOM API key not configured, falling back to MLS API...');
          const mlsProperty = await getMLSPropertyDetails(`${processedProperty.address}-${processedProperty.city}-${processedProperty.state}`);
          if (mlsProperty) {
            return mlsProperty;
          }
        }
      } catch (apiError) {
        console.error('Error fetching property details from external API:', apiError);
        // Fall back to local property if API lookup fails
      }
    }
    
    // If we don't have the property locally or failed to get MLS details
    return processedProperty || null;
  } catch (error) {
    console.error('Error in getPropertyDetails:', error);
    return null;
  }
}

/**
 * Get market data for a specific location, combining local and MLS data
 */
export async function getMarketData(city: string, state: string, zipCode?: string): Promise<any[]> {
  try {
    // Query local database first
    let query = db.select().from(marketData)
      .where(
        and(
          eq(marketData.city, city),
          eq(marketData.state, state)
        )
      )
      .orderBy(marketData.year, marketData.month);
      
    if (zipCode) {
      query = query.where(eq(marketData.zipCode, zipCode));
    }
    
    const localMarketData = await query;
    
    // If we have recent data (less than 30 days old) or MLS API is not configured, return local data
    const hasRecentData = localMarketData.some(data => {
      const dataDate = new Date(data.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return dataDate >= thirtyDaysAgo;
    });
    
    if (hasRecentData || !process.env.MLS_API_KEY || localMarketData.length >= 12) {
      return localMarketData;
    }
    
    // Otherwise, we would fetch fresh market data from MLS
    // This would be implemented when MLS API credentials are available
    
    return localMarketData;
  } catch (error) {
    console.error('Error in getMarketData:', error);
    return [];
  }
}

// Remove duplicate import since or is already imported at the top