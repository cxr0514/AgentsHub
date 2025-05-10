import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Property } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get Mapbox token from environment if available, fallback to public demo token
// In production, you should always use a restricted token from env vars
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

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

  // Helper function to format price
  const formatPrice = (price: string) => {
    return `$${Number(price).toLocaleString()}`;
  };
  
  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);
  
  // Update markers when properties change
  useEffect(() => {
    if (!map.current) return;
    
    // Remove existing markers
    mapMarkers.current.forEach(marker => marker.remove());
    mapMarkers.current = [];
    
    // Filter only properties with valid coordinates
    const validProperties = properties.filter(p => 
      p.latitude && p.longitude && 
      !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
    );
    
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
  }, [properties, onPropertySelect]);
  
  return (
    <div className="h-[600px] w-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapSearch;