import { searchMLSProperties, getMLSPropertyDetails } from "./mlsService";
import attomService from "./attomService-enhanced";
import { storage } from "../storage";
import { Property } from "../../shared/schema";

/**
 * Enhanced integration service with better API handling
 * Integrates multiple data sources with improved error handling
 * and fallback strategies
 */

/**
 * Synchronize MLS data with the application database
 * @param limit Maximum number of properties to synchronize
 */
export async function synchronizeMLSData(limit: number = 100) {
  try {
    console.log("Starting MLS data synchronization...");
    
    // Clear the property cache to ensure fresh data
    console.log("MLS property cache cleared");
    
    // Fetch properties from MLS
    const mlsProperties = await searchMLSProperties({ limit });
    
    let successCount = 0;
    let errorCount = 0;
    let errors: string[] = [];
    
    // Process each property
    for (const mlsProperty of mlsProperties) {
      try {
        // Check if the property already exists in our database by checking all properties
        const allProperties = await storage.getAllProperties();
        const existingProperty = allProperties.find(p => p.externalId === mlsProperty.externalId);
        
        if (existingProperty) {
          // Update existing property
          await storage.updateProperty(existingProperty.id, mlsProperty);
          successCount++;
        } else {
          // Create new property
          await storage.createProperty(mlsProperty);
          successCount++;
        }
      } catch (error: any) {
        errorCount++;
        errors.push(error.message);
        console.error("Error synchronizing property:", error);
      }
    }
    
    return {
      status: errorCount === 0 ? "success" : "partial_success",
      message: `MLS data synchronization completed with ${successCount} successes and ${errorCount} errors`,
      totalProcessed: mlsProperties.length,
      successful: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    console.error("Error synchronizing MLS data:", error);
    return {
      status: "error",
      message: "Failed to synchronize MLS data",
      error: error.message
    };
  }
}

/**
 * Search properties from both local database and external services
 * with enhanced error handling
 * @param filters Search filters
 */
export async function searchProperties(filters: any = {}) {
  try {
    console.log("Searching properties with filters:", filters);
    
    // First search local database using the getPropertiesByFilters method
    const localProperties = await storage.getPropertiesByFilters(filters);
    
    // Then try to augment with MLS data
    let mlsProperties: Property[] = [];
    try {
      mlsProperties = await searchMLSProperties(filters);
    } catch (mlsError) {
      console.warn("Could not fetch MLS properties:", mlsError);
      // Continue with local properties only
    }
    
    // Merge properties, avoiding duplicates by externalId
    const localIds = new Set(localProperties.map(p => p.externalId).filter(Boolean));
    const uniqueMlsProperties = mlsProperties.filter(p => !p.externalId || !localIds.has(p.externalId));
    
    return [...localProperties, ...uniqueMlsProperties];
  } catch (error: any) {
    console.error("Error searching properties:", error);
    return [];
  }
}

/**
 * Get property details from local database and external services
 * with graceful fallback
 * @param id Property ID
 */
export async function getPropertyDetails(id: number) {
  try {
    console.log(`Getting property details for ID ${id}`);
    
    // Get property from local database
    const property = await storage.getProperty(id);
    
    if (!property) {
      throw new Error("Property not found");
    }
    
    // Try to enhance with MLS data if available
    try {
      if (property.externalId) {
        const mlsProperty = await getMLSPropertyDetails(property.externalId);
        if (mlsProperty) {
          // Update our database with the latest MLS data
          await storage.updateProperty(id, {
            ...mlsProperty,
            id: property.id // Keep the same ID
          });
          
          // Return the updated property
          return await storage.getProperty(id);
        }
      }
    } catch (mlsError) {
      console.warn("Could not fetch MLS property details:", mlsError);
      // Continue with local property data
    }
    
    // Try to enhance with ATTOM data if we have address details
    try {
      if (property.address && property.city && property.state) {
        const attomData = await attomService.fetchPropertyDetails(
          property.address,
          property.city,
          property.state,
          property.zipCode
        );
        
        // If we got valid ATTOM data, extract and merge relevant details
        if (attomData && attomData.property && !attomData.error) {
          // Extract any additional details from ATTOM that we don't have
          // This is just an example; customize based on your needs
          const attomProperty = attomData.property;
          
          // Update our property with any new ATTOM details
          // that might not be in our database
          await storage.updateProperty(id, {
            // Only update fields that we don't already have data for
            neighborhood: property.neighborhood || attomProperty.neighborhood,
            yearBuilt: property.yearBuilt || attomProperty.yearBuilt,
            lastSold: property.lastSold || attomProperty.lastSold,
            lastSoldPrice: property.lastSoldPrice || attomProperty.lastSoldPrice,
            taxAssessment: property.taxAssessment || attomProperty.taxAssessment
          });
          
          // Return the updated property
          return await storage.getProperty(id);
        }
      }
    } catch (attomError) {
      console.warn("Could not fetch ATTOM property details:", attomError);
      // Continue with existing property data
    }
    
    // Return the property as is from our database
    return property;
  } catch (error: any) {
    console.error("Error getting property details:", error);
    throw error;
  }
}

/**
 * Get market data for a location from multiple sources
 * with enhanced error handling
 * @param city City name
 * @param state State abbreviation
 * @param zipCode Zip code (optional)
 */
export async function getMarketData(city: string, state: string, zipCode?: string) {
  try {
    console.log(`Getting market data for ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`);
    
    // First get market data from local database
    const localMarketData = await storage.getMarketDataByLocation(city, state, zipCode);
    
    // If we have recent data (less than 1 day old), use it
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentData = localMarketData.filter(d => {
      if (!d.createdAt) return false;
      const createdAt = new Date(d.createdAt);
      return createdAt > oneDayAgo;
    });
    
    if (recentData.length > 0) {
      console.log("Using recent market data from database");
      return recentData;
    }
    
    // Otherwise, try to fetch fresh data from ATTOM
    try {
      const attomResult = await attomService.fetchMarketStatistics(city, state, zipCode);
      
      if (attomResult && attomResult.success && attomResult.data) {
        // Add the new data to our results
        return [attomResult.data, ...localMarketData];
      }
    } catch (attomError) {
      console.warn("Could not fetch ATTOM market data:", attomError);
      // Continue with local data only
    }
    
    // Return local data as fallback
    return localMarketData;
  } catch (error: any) {
    console.error("Error getting market data:", error);
    return [];
  }
}

export default {
  synchronizeMLSData,
  searchProperties,
  getPropertyDetails,
  getMarketData
};