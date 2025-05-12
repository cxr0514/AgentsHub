import { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import PropertyCard from './PropertyCard';
import { cn } from '@/lib/utils';
import { Grid2X2, List, Rows3 } from 'lucide-react';
import { Button } from './ui/button';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import useMobile from '@/hooks/use-mobile';

interface ResponsivePropertyGridProps {
  properties: Property[];
  onSaveProperty?: (propertyId: number) => void;
  savedPropertyIds?: number[];
  emptyMessage?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list' | 'compact';

export default function ResponsivePropertyGrid({
  properties,
  onSaveProperty,
  savedPropertyIds = [],
  emptyMessage = 'No properties found',
  className
}: ResponsivePropertyGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const isMobile = useMobile();
  
  // Auto-switch to compact view on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'grid') {
      setViewMode('compact');
    }
  }, [isMobile]);

  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid2X2 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="Compact view">
            <Rows3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {properties.map((property) => (
            <div key={property.id}>
              <PropertyCard
                property={property}
                onSave={onSaveProperty}
                isSaved={savedPropertyIds.includes(property.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id}>
              <PropertyCard
                property={property}
                onSave={onSaveProperty}
                isSaved={savedPropertyIds.includes(property.id)}
                compact={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Compact view - optimized for mobile */}
      {viewMode === 'compact' && (
        <div className="space-y-3">
          {properties.map((property) => (
            <div key={property.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <PropertyCard
                property={property}
                onSave={onSaveProperty}
                isSaved={savedPropertyIds.includes(property.id)}
                compact={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}