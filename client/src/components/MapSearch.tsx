import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// The access token is available as public information to use Mapbox
// This is perfectly safe to include in client code and is designed to be public
// See: https://docs.mapbox.com/help/glossary/access-token/
mapboxgl.accessToken = 'pk.eyJ1IjoicHJvcGludmVzdGFpIiwiYSI6ImNsdHBvMGFwYzAwYzIya3F3MHdzZXoxM2gifQ.e5QjvbCVDM9vZ0KswgdzYA';

interface MapSearchProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

const MapSearch = ({ properties, onPropertySelect }: MapSearchProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Initialize map only once
    if (!map.current && mapContainer.current) {
      // Default center point (Atlanta, GA)
      const defaultCenter = [-84.3963, 33.7756];
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter as [number, number],
        zoom: 10,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }));

      map.current.on('load', () => {
        setLoaded(true);
      });
    }

    return () => {
      if (map.current) {
        // Cleanup markers is handled when displaying new ones
        // map.current.remove();
        // map.current = null;
      }
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Clear existing markers
    document.querySelectorAll('.mapbox-marker').forEach(el => el.remove());

    // If no properties, center on default location
    if (properties.length === 0) {
      map.current.flyTo({
        center: [-84.3963, 33.7756], // Atlanta, GA
        zoom: 10,
        essential: true
      });
      return;
    }

    // Add new markers and collect coordinates for bounds
    const bounds = new mapboxgl.LngLatBounds();
    
    properties.forEach(property => {
      if (!property.latitude || !property.longitude) return;
      
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.innerHTML = `
        <div class="mapbox-marker-inner">
          <div class="mapbox-marker-price">$${parseInt(property.price).toLocaleString()}</div>
        </div>
      `;
      el.style.cursor = 'pointer';
      
      // Add click handler
      el.addEventListener('click', () => {
        if (onPropertySelect) {
          onPropertySelect(property);
        }
      });
      
      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 10px; text-align: left; font-family: 'Inter', sans-serif;">
          <h3 style="margin: 0 0 5px; font-size: 14px; font-weight: 600;">${property.address}</h3>
          <div style="margin: 0 0 5px; font-size: 16px; font-weight: 600; color: #FF7A00;">$${parseInt(property.price).toLocaleString()}</div>
          <div style="margin: 0; font-size: 13px; color: #555;">${property.bedrooms} bd | ${property.bathrooms} ba | ${parseInt(property.squareFeet).toLocaleString()} sqft</div>
          <div style="margin: 5px 0 0; font-size: 12px; color: #777;">${property.city}, ${property.state} ${property.zipCode}</div>
        </div>
      `);
      
      // Create marker and add to map
      new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);
      
      // Extend bounds to include this point
      bounds.extend([lng, lat]);
    });

    // Adjust map to fit all markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [properties, loaded, onPropertySelect]);

  return (
    <div className="h-full w-full relative">
      <style jsx>{`
        .mapbox-marker {
          width: auto;
          white-space: nowrap;
          position: relative;
        }
        .mapbox-marker-inner {
          background-color: #FF7A00;
          color: white;
          font-weight: 500;
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
        }
        .mapbox-marker-inner::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #FF7A00 transparent transparent transparent;
        }
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 3px 14px rgba(0,0,0,0.15);
        }
        .mapboxgl-popup-close-button {
          font-size: 16px;
          padding: 3px 6px;
        }
      `}</style>
      
      <div ref={mapContainer} className="h-full w-full rounded-md overflow-hidden" />
      
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSearch;