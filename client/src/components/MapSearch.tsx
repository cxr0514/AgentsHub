import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Property } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import 'mapbox-gl/dist/mapbox-gl.css';

// This component can work in two modes:
// 1. Map mode - When a valid Mapbox token is available
// 2. Fallback table mode - When Mapbox map can't be displayed
// 
// A project using this in production should get a valid Mapbox token
// by signing up at https://www.mapbox.com/ and setting the 
// VITE_MAPBOX_TOKEN environment variable

// For demonstration purposes, we're setting a value, but it may not work
// Check if we need to use a different approach for the demo
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

// Set the API token
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapSearchProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

const MapSearch = ({ properties, onPropertySelect }: MapSearchProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState<[number, number]>([-122.4194, 37.7749]); // [lng, lat] - Default to San Francisco
  const [zoom, setZoom] = useState<number>(12);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const mapMarkers = useRef<mapboxgl.Marker[]>([]);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Helper function to format price
  const formatPrice = (price: string) => {
    return `$${Number(price).toLocaleString()}`;
  };
  
  // Check if we have a valid Mapbox token before trying to initialize the map
  useEffect(() => {
    // If we don't have a valid token, immediately set error state to show fallback UI
    if (!MAPBOX_TOKEN) {
      setMapError('A Mapbox API key is required for the map feature. Please add your Mapbox token to the VITE_MAPBOX_TOKEN environment variable.');
      return;
    }
    
    if (!mapContainer.current) return;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: center,
        zoom: zoom
      });
      
      // Add error handler for authentication errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        // Check specifically for authentication errors
        if (e.error && e.error.status === 401) {
          setMapError('Authentication failed: Please provide a valid Mapbox API key in the VITE_MAPBOX_TOKEN environment variable.');
        } else {
          setMapError('Error loading map: ' + (e.error?.message || 'Unknown error'));
        }
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'top-right');
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Could not initialize map. Please check your internet connection or try again later.');
    }
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);
  
  // Update markers when properties change
  useEffect(() => {
    // Skip marker updates if there's an error or no map
    if (mapError || !map.current) return;
    
    try {
      // Remove existing markers
      mapMarkers.current.forEach(marker => marker.remove());
      mapMarkers.current = [];
      
      // Filter only properties with valid coordinates
      const validProperties = properties.filter(p => 
        p.latitude && p.longitude && 
        !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
      );
      
      // If no valid properties with coordinates, set error to show fallback
      if (validProperties.length === 0) {
        setMapError('No properties with valid coordinates found. Showing properties in list view instead.');
        return;
      }
      
      // If we have valid properties, center the map on the first one (only on initial load)
      if (validProperties.length > 0 && mapMarkers.current.length === 0) {
        setCenter([Number(validProperties[0].longitude), Number(validProperties[0].latitude)]);
        if (map.current) {
          map.current.setCenter([Number(validProperties[0].longitude), Number(validProperties[0].latitude)]);
        }
      }
      
      // Add markers for each property
      validProperties.forEach(property => {
        // Create a custom HTML element for the marker
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = 'var(--primary)';
        el.style.color = 'white';
        el.style.padding = '2px 8px';
        el.style.borderRadius = '4px';
        el.style.fontSize = '14px';
        el.style.fontWeight = '600';
        el.style.cursor = 'pointer';
        el.innerText = formatPrice(property.price);
        
        // Add the marker to the map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([Number(property.longitude), Number(property.latitude)])
          .addTo(map.current!);
        
        // Add click event
        el.addEventListener('click', () => {
          if (onPropertySelect) {
            onPropertySelect(property);
          }
          setSelectedProperty(property);
          
          // Create popup
          if (popup.current) {
            popup.current.remove();
          }
          
          // Create HTML content for the popup
          const popupNode = document.createElement('div');
          popupNode.innerHTML = `
            <div class="p-2">
              <div class="text-sm mb-1 font-semibold">${property.address}</div>
              <div class="text-xs text-gray-600 mb-2">
                ${property.city}, ${property.state} ${property.zipCode}
              </div>
              <div class="flex justify-between text-xs mb-2">
                <span>${formatPrice(property.price)}</span>
                <span>
                  ${property.bedrooms} bd | ${property.bathrooms} ba | ${Number(property.squareFeet).toLocaleString()} sqft
                </span>
              </div>
              <button id="view-details-btn" class="w-full text-xs bg-primary text-white py-2 px-4 rounded">
                View Details
              </button>
            </div>
          `;
          
          // Create the popup
          popup.current = new mapboxgl.Popup({ closeOnClick: false, offset: 15 })
            .setLngLat([Number(property.longitude), Number(property.latitude)])
            .setDOMContent(popupNode)
            .addTo(map.current!);
          
          // Add click event for view details button
          popupNode.querySelector('#view-details-btn')?.addEventListener('click', () => {
            window.location.href = `/properties/${property.id}`;
          });
        });
        
        mapMarkers.current.push(marker);
      });
    } catch (error) {
      console.error('Error adding map markers:', error);
      setMapError('Error displaying properties on map. Showing fallback table view instead.');
    }
  }, [properties, onPropertySelect, mapError]);
  
  // If there's an error loading the map, show a fallback table view of properties
  if (mapError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-center text-text-secondary mb-4">
          <p className="text-red-500 font-semibold mb-2">{mapError}</p>
          <p>Showing property list instead:</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{property.address}</div>
                        <div className="text-sm text-gray-500">{property.city}, {property.state} {property.zipCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPrice(property.price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{property.bedrooms} bd | {property.bathrooms} ba | {Number(property.squareFeet).toLocaleString()} sqft</div>
                    <div className="text-sm text-gray-500">{property.propertyType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a
                      href={`/properties/${property.id}`}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // Normal map view
  return (
    <div className="h-[600px] w-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapSearch;