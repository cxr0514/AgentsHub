import { useState, useEffect, useRef } from 'react';
import ReactMapGL, { Source, Layer, NavigationControl, Popup } from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { Property } from '@shared/schema';
import { Loader2, Home, DollarSign, TrendingUp, LayoutGrid, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the types of heatmap data
type HeatmapType = 'price' | 'value' | 'trend' | 'inventory';

// Define the property with location for the map
interface PropertyWithLocation {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number | string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: string;
  yearBuilt?: number | null;
  longitude: number;
  latitude: number;
  status?: string;
  images?: string[] | Record<string, string> | null;
}

interface MapHeatmapProps {
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
  properties?: Property[];
  showControls?: boolean;
  height?: string;
  onPropertyClick?: (property: Property) => void;
}

const MapHeatmap = ({
  initialCenter = [-84.388, 33.749], // Atlanta by default
  initialZoom = 10,
  properties = [],
  showControls = true,
  height = '600px',
  onPropertyClick
}: MapHeatmapProps) => {
  const { toast } = useToast();
  const mapRef = useRef(null);
  const [heatmapType, setHeatmapType] = useState<HeatmapType>('price');
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithLocation | null>(null);
  const [viewport, setViewport] = useState({
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    zoom: initialZoom
  });

  // Get market data for the heatmap
  const { data: marketData, isLoading: isLoadingMarketData } = useQuery({
    queryKey: ['/api/market-data/heatmap'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/market-data/heatmap');
      if (!response.ok) {
        throw new Error('Failed to fetch market data for heatmap');
      }
      return response.json();
    }
  });

  // Filter properties to only include those with valid coordinates
  const validProperties = (properties || []).filter(
    (property) => 
      property.latitude !== null && 
      property.longitude !== null && 
      !isNaN(Number(property.latitude)) && 
      !isNaN(Number(property.longitude))
  ).map(property => ({
    id: property.id,
    address: property.address,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    propertyType: property.propertyType,
    yearBuilt: property.yearBuilt,
    status: property.status,
    images: property.images,
    latitude: Number(property.latitude),
    longitude: Number(property.longitude)
  }));

  // Create GeoJSON for property points
  const propertiesGeoJSON = {
    type: 'FeatureCollection',
    features: validProperties.map(property => ({
      type: 'Feature',
      properties: {
        id: property.id,
        address: property.address,
        price: property.price,
        beds: property.bedrooms,
        baths: property.bathrooms,
        sqft: property.squareFeet,
        propertyType: property.propertyType,
        yearBuilt: property.yearBuilt
      },
      geometry: {
        type: 'Point',
        coordinates: [property.longitude, property.latitude]
      }
    }))
  };

  // Create heatmap GeoJSON based on selected type
  const getHeatmapGeoJSON = () => {
    if (!marketData || !marketData.locations) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    return {
      type: 'FeatureCollection',
      features: marketData.locations.map((location: any) => {
        // Get value based on heatmap type
        let value = 0;
        switch (heatmapType) {
          case 'price':
            value = location.medianPrice || 0;
            break;
          case 'value':
            value = location.pricePerSqFt || 0;
            break;
          case 'trend':
            value = location.yearOverYearChange || 0;
            break;
          case 'inventory':
            value = location.activeListings || 0;
            break;
        }

        return {
          type: 'Feature',
          properties: {
            value
          },
          geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          }
        };
      })
    };
  };

  // Get heatmap layer based on type
  const getHeatmapLayer = () => {
    const colorRamps = {
      price: [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, 'rgba(65, 182, 196, 0)',
        100000, 'rgba(65, 182, 196, 0.3)',
        300000, 'rgba(251, 176, 59, 0.6)',
        600000, 'rgba(220, 55, 19, 0.8)',
        1000000, 'rgba(165, 0, 38, 1)'
      ],
      value: [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, 'rgba(65, 182, 196, 0)',
        100, 'rgba(65, 182, 196, 0.3)',
        200, 'rgba(251, 176, 59, 0.6)',
        300, 'rgba(220, 55, 19, 0.8)',
        500, 'rgba(165, 0, 38, 1)'
      ],
      trend: [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        -10, 'rgba(165, 0, 38, 0.8)',
        -5, 'rgba(220, 55, 19, 0.6)',
        0, 'rgba(251, 176, 59, 0.3)',
        5, 'rgba(145, 191, 106, 0.5)',
        10, 'rgba(65, 182, 196, 0.8)'
      ],
      inventory: [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, 'rgba(65, 182, 196, 0)',
        10, 'rgba(65, 182, 196, 0.3)',
        50, 'rgba(251, 176, 59, 0.6)',
        100, 'rgba(220, 55, 19, 0.8)',
        200, 'rgba(165, 0, 38, 1)'
      ]
    };

    return {
      id: 'heatmap-layer',
      type: 'heatmap',
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, 0,
          1000000, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          9, 3
        ],
        'heatmap-color': colorRamps[heatmapType],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 20,
          9, 40
        ],
        'heatmap-opacity': 0.8
      }
    };
  };

  // Handle property click
  const handlePropertyClick = (property: PropertyWithLocation) => {
    setSelectedProperty(property);
    if (onPropertyClick) {
      // Convert to generic Property type for parent component
      onPropertyClick(property as unknown as Property);
    }
  };

  // Format price for display
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  // Setup map controls and event handlers
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Add click handler for property points
    const map = mapRef.current.getMap();
    map.on('click', 'property-points', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const propertyId = feature.properties?.id;
        
        const property = validProperties.find(p => p.id === propertyId);
        if (property) {
          handlePropertyClick(property);
        }
      }
    });

    // Change cursor when hovering over property points
    map.on('mouseenter', 'property-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'property-points', () => {
      map.getCanvas().style.cursor = '';
    });

    return () => {
      // Cleanup event listeners
      map.off('click', 'property-points');
      map.off('mouseenter', 'property-points');
      map.off('mouseleave', 'property-points');
    };
  }, [validProperties]);

  return (
    <div className="w-full h-full flex flex-col">
      {showControls && (
        <div className="mb-4">
          <Tabs 
            defaultValue="price" 
            value={heatmapType}
            onValueChange={(value) => setHeatmapType(value as HeatmapType)}
          >
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="price" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Price
              </TabsTrigger>
              <TabsTrigger value="value" className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Value
              </TabsTrigger>
              <TabsTrigger value="trend" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trend
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Inventory
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[#41b6c4] mr-1"></span>
                <span>Low</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[#fbb03b] mr-1"></span>
                <span>Medium</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[#dc3713] mr-1"></span>
                <span>High</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[#a50026] mr-1"></span>
                <span>Very High</span>
              </div>
            </div>
          </Tabs>
        </div>
      )}
      
      <div 
        className="relative w-full rounded-md overflow-hidden border border-border" 
        style={{ height }}
      >
        {(isLoadingMarketData || validProperties.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Loading map data...</p>
            </div>
          </div>
        )}
        
        <ReactMapGL
          ref={mapRef}
          mapboxAccessToken="pk.eyJ1IjoicHJvcGludmVzdGFpIiwiYSI6ImNsdHBvMGFwYzAwYzIya3F3MHdzZXoxM2gifQ.e5QjvbCVDM9vZ0KswgdzYA"
          mapStyle="mapbox://styles/mapbox/light-v11"
          initialViewState={viewport}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          {/* Heatmap layer */}
          {marketData && (
            <Source type="geojson" data={getHeatmapGeoJSON()}>
              <Layer {...getHeatmapLayer()} />
            </Source>
          )}
          
          {/* Property points */}
          {validProperties.length > 0 && (
            <Source id="properties" type="geojson" data={propertiesGeoJSON}>
              <Layer
                id="property-points"
                type="circle"
                paint={{
                  'circle-radius': 6,
                  'circle-color': '#FF7A00',
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#fff'
                }}
              />
            </Source>
          )}
          
          {/* Selected property popup */}
          {selectedProperty && (
            <Popup
              longitude={selectedProperty.longitude}
              latitude={selectedProperty.latitude}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setSelectedProperty(null)}
              className="z-10"
            >
              <Card className="border-0 shadow-none">
                <CardContent className="p-3">
                  <div className="text-sm font-semibold mb-1 flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-[#FF7A00]" />
                    {selectedProperty.address}
                  </div>
                  <div className="text-xl font-bold text-[#071224] mb-1">
                    {formatPrice(selectedProperty.price)}
                  </div>
                  <div className="text-sm text-muted-foreground flex space-x-2">
                    <span>{selectedProperty.bedrooms} bed</span>
                    <span>•</span>
                    <span>{selectedProperty.bathrooms} bath</span>
                    <span>•</span>
                    <span>{selectedProperty.squareFeet} sq ft</span>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full mt-2 bg-[#071224] hover:bg-[#0f1d31] text-white"
                    onClick={() => {
                      if (onPropertyClick) {
                        onPropertyClick(selectedProperty);
                      }
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Popup>
          )}
          
          <NavigationControl position="top-right" />
        </Map>
      </div>
    </div>
  );
};

export default MapHeatmap;