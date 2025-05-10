/**
 * MLS API Client - Handles communication with MLS API endpoints
 */

/**
 * Search for properties with optional filters
 */
export async function searchProperties(filters: any = {}) {
  const params = new URLSearchParams();
  
  // Add all provided filters to query parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  const queryString = params.toString();
  const url = `/api/properties${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }
  
  return await response.json();
}

/**
 * Get details for a specific property
 */
export async function getPropertyDetails(propertyId: number) {
  const response = await fetch(`/api/properties/${propertyId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch property details');
  }
  
  return await response.json();
}

/**
 * Get market data for a location
 */
export async function getMarketData(city: string, state: string, zipCode?: string) {
  const params = new URLSearchParams({
    city,
    state
  });
  
  if (zipCode) {
    params.append('zipCode', zipCode);
  }
  
  const response = await fetch(`/api/market-data?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  
  return await response.json();
}

/**
 * Trigger synchronization with MLS data
 */
export async function synchronizeMLSData(limit: number = 100) {
  const response = await fetch('/api/mls/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ limit })
  });
  
  if (!response.ok) {
    throw new Error('Failed to synchronize MLS data');
  }
  
  return await response.json();
}

/**
 * Get the status of the MLS connection
 */
export async function getMLSStatus() {
  try {
    // Just get all properties to count them
    const propertiesResponse = await fetch('/api/properties');
    
    let status = {
      connected: true, // Assume connected for now until we implement the real API
      lastSync: null,
      propertyCount: 0
    };
    
    // Get the count of properties in the system
    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json();
      status.propertyCount = Array.isArray(propertiesData) ? propertiesData.length : 0;
      
      // Mock last sync time - in a real implementation this would come from the backend
      status.lastSync = new Date().toISOString();
    }
    
    return status;
  } catch (error) {
    console.error('Error getting MLS status:', error);
    return {
      connected: false,
      lastSync: null,
      propertyCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}