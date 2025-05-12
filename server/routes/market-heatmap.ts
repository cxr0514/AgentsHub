import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { getMarketData } from '../services/integrationService';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

/**
 * Get heatmap data for market visualization
 * This endpoint processes market data into a format suitable for map heatmap visualization
 */
router.get('/heatmap', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Get locations with coordinates from query params
    const { city = 'Atlanta', state = 'GA' } = req.query;
    
    // Get nearby locations for the heatmap
    // Fetch all market data
    let marketData = [];
    
    // Query market data for the location and surrounding areas
    if (typeof city === 'string' && typeof state === 'string') {
      marketData = await storage.getMarketDataByLocation(city, state);
    } else {
      // Get a list of major cities to populate the heatmap
      const majorCities = [
        { city: 'Atlanta', state: 'GA' },
        { city: 'Canton', state: 'GA' },
        { city: 'Woodstock', state: 'GA' },
        { city: 'Alpharetta', state: 'GA' },
        { city: 'Marietta', state: 'GA' },
        { city: 'Roswell', state: 'GA' }
      ];
      
      // Fetch market data for each major city
      for (const location of majorCities) {
        const cityData = await storage.getMarketDataByLocation(location.city, location.state);
        marketData = [...marketData, ...cityData];
      }
    }
    
    // Process market data for heatmap visualization
    const locations = await processLocationsForHeatmap(marketData);
    
    res.json({ locations });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch heatmap data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process market data into format suitable for heatmap visualization
 */
async function processLocationsForHeatmap(marketData: any[]) {
  // Add geocoding for locations without coordinates
  const locationsWithCoordinates = await Promise.all(
    marketData.map(async (location) => {
      // For locations without coordinates, use geocoding service
      if (!location.latitude || !location.longitude) {
        try {
          // Use approximate coordinates for major cities for now
          // In a production environment, we would use a real geocoding service
          const coordinates = getApproximateCoordinates(location.city, location.state);
          return {
            ...location,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          };
        } catch (error) {
          console.error(`Failed to geocode location: ${location.city}, ${location.state}`, error);
          return null;
        }
      }
      
      return location;
    })
  );
  
  // Filter out locations without coordinates
  return locationsWithCoordinates.filter(Boolean).map(location => ({
    id: location.id,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode,
    latitude: location.latitude,
    longitude: location.longitude,
    medianPrice: parseFloat(location.medianPrice) || 0,
    averagePrice: parseFloat(location.averagePrice) || 0,
    pricePerSqFt: parseFloat(location.averagePricePerSqft) || 0,
    activeListings: location.activeListings || 0,
    daysOnMarket: location.daysOnMarket || 0,
    yearOverYearChange: location.yearOverYearChange || 0,
    marketTrend: location.marketTrend || 'stable'
  }));
}

/**
 * Get approximate coordinates for a city and state
 * In a production environment, we would use a real geocoding service
 */
function getApproximateCoordinates(city: string, state: string) {
  // Major cities with approximate coordinates
  const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
    'Atlanta': { latitude: 33.749, longitude: -84.388 },
    'Canton': { latitude: 34.237, longitude: -84.491 },
    'Woodstock': { latitude: 34.101, longitude: -84.519 },
    'Alpharetta': { latitude: 34.075, longitude: -84.294 },
    'Marietta': { latitude: 33.952, longitude: -84.549 },
    'Roswell': { latitude: 34.023, longitude: -84.361 },
    'Sandy Springs': { latitude: 33.930, longitude: -84.374 },
    'Brookhaven': { latitude: 33.888, longitude: -84.339 },
    'Smyrna': { latitude: 33.883, longitude: -84.514 },
    'Dunwoody': { latitude: 33.946, longitude: -84.334 },
    'Johns Creek': { latitude: 34.028, longitude: -84.198 },
  };
  
  // Return coordinates if city is found, otherwise default to Atlanta
  return cityCoordinates[city] || { latitude: 33.749, longitude: -84.388 };
}

export default router;