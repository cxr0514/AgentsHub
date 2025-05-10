/**
 * MLS API Client - Handles communication with MLS API endpoints
 */
import { apiRequest } from './queryClient';
import { Property, MarketData } from '@shared/schema';

/**
 * Search for properties with optional filters
 */
export async function searchProperties(filters: any = {}) {
  // Build query params for the request
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest<Property[]>(`/api/properties${queryString}`, { method: 'GET' });
}

/**
 * Get details for a specific property
 */
export async function getPropertyDetails(propertyId: number) {
  return apiRequest<Property>(`/api/properties/${propertyId}`, { method: 'GET' });
}

/**
 * Get market data for a location
 */
export async function getMarketData(city: string, state: string, zipCode?: string) {
  // Build query params for the request
  const queryParams = new URLSearchParams();
  queryParams.append('city', city);
  queryParams.append('state', state);
  
  if (zipCode) {
    queryParams.append('zipCode', zipCode);
  }
  
  return apiRequest<MarketData[]>(`/api/market-data?${queryParams.toString()}`, { method: 'GET' });
}

/**
 * Trigger synchronization with MLS data
 */
export async function synchronizeMLSData(limit: number = 100) {
  return apiRequest<{
    status: string;
    message: string;
    count?: number;
  }>('/api/mls/sync', {
    method: 'POST',
    body: JSON.stringify({ limit }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Get the status of the MLS connection
 */
export async function getMLSStatus() {
  try {
    const result = await synchronizeMLSData(1);
    return {
      isConfigured: result.status !== 'warning',
      message: result.message
    };
  } catch (error) {
    return {
      isConfigured: false,
      message: error instanceof Error ? error.message : 'Unknown error checking MLS status'
    };
  }
}