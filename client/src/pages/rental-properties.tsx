import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Building2, Search, Filter, MapPin, Loader2, Info, UploadCloud, Image } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { getPropertyImage } from '@/utils/rentalImageUtils';

// Type for rental units in a property
interface RentalUnit {
  price: string;
  beds: string;
  baths?: string;
  roomForRent: boolean;
}

// Type for rental property data from API
interface RentalProperty {
  id: number;
  address: string;
  addressCity: string;
  addressState: string;
  addressZipcode: number;
  buildingName?: string;
  statusType: string;
  propertyType: string;
  units: RentalUnit[];
  mainImageUrl?: string;
  latitude?: number;
  longitude?: number;
  images?: Array<{url: string}>;
  createdAt: string;
  detailUrl?: string;
  source?: string;
}

// Placeholder image component with enhanced styling
const PropertyImageWithFallback = ({ property }: { property: RentalProperty }) => {
  // Use the property's image if available, otherwise generate one based on property type and ID
  const imageUrl = property.mainImageUrl || getPropertyImage(property.propertyType || 'apartment', property.id);
  
  return (
    <div className="relative h-40 w-full">
      <img 
        src={imageUrl} 
        alt={property.address}
        className="h-40 w-full object-cover rounded-t-md"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = getPropertyImage('apartment', property.id);
        }}
      />
      {property.source && (
        <div className="absolute bottom-1 right-1 text-xs bg-black bg-opacity-70 text-white px-1 py-0.5 rounded">
          {property.source}
        </div>
      )}
    </div>
  );
};

export default function RentalPropertiesPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  // Fetch rental properties
  const { data: properties, isLoading, error } = useQuery<RentalProperty[]>({
    queryKey: ['/api/rentals/rental-properties'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter properties based on search query and filters
  const filteredProperties = properties?.filter(property => {
    // Search query filter (address, city, property type)
    const searchTerms = searchQuery.toLowerCase();
    const matchesSearch = 
      searchQuery === '' || 
      property.address.toLowerCase().includes(searchTerms) ||
      property.addressCity.toLowerCase().includes(searchTerms) ||
      property.propertyType.toLowerCase().includes(searchTerms) ||
      (property.buildingName && property.buildingName.toLowerCase().includes(searchTerms));
    
    // Location filter (city, state)
    const matchesLocation = 
      locationFilter === '' || 
      property.addressCity.toLowerCase().includes(locationFilter.toLowerCase()) ||
      property.addressState.toLowerCase().includes(locationFilter.toLowerCase());
    
    // Price filter (simple contains check on the price string)
    const matchesPrice = 
      priceFilter === '' || 
      property.units.some(unit => unit.price.includes(priceFilter));
    
    return matchesSearch && matchesLocation && matchesPrice;
  });

  // Format the price range for a property with multiple units
  const formatPriceRange = (units: RentalUnit[]) => {
    if (!units || units.length === 0) return 'Price not available';
    
    if (units.length === 1) {
      return units[0].price;
    }
    
    // Extract numeric values from price strings for sorting
    const prices = units.map(unit => {
      const numericPrice = parseFloat(unit.price.replace(/[^0-9.]/g, ''));
      return isNaN(numericPrice) ? 0 : numericPrice;
    });
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toLocaleString()}`;
    }
    
    return `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
  };

  // Handle property card click
  const handlePropertyClick = (id: number) => {
    setLocation(`/rental-analysis/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Rental Properties</h1>
          
          <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background"
              />
            </div>
            
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setLocation('/rental-properties/import')}
                className="bg-[#0f1d31] hover:bg-[#192841]"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-[#0f1d31]" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filters section */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#050e1d] border border-[#0f1d31] rounded-md">
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                placeholder="City or State"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Price Range</label>
              <Input
                placeholder="Price (e.g. 1000)"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setLocationFilter('');
                  setPriceFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
        
        {/* Error handling */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load rental properties. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && filteredProperties && filteredProperties.length === 0 && (
          <Alert className="mt-4 bg-[#071224] border-[#0f1d31]">
            <Info className="h-4 w-4" />
            <AlertTitle>No properties found</AlertTitle>
            <AlertDescription>
              {properties && properties.length > 0 
                ? "No properties match your search criteria. Try adjusting your filters."
                : "No rental properties are available. Please check back later."}
            </AlertDescription>
          </Alert>
        )}

        {/* Property list */}
        {!isLoading && filteredProperties && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="overflow-hidden border border-[#0f1d31] bg-[#071224] transition-all duration-200 hover:shadow-md cursor-pointer"
                onClick={() => handlePropertyClick(property.id)}
              >
                <PropertyImageWithFallback property={property} />
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold line-clamp-1">
                      {property.buildingName || property.address}
                    </h3>
                    <Badge variant={property.statusType === 'For Rent' ? 'default' : 'secondary'} className="ml-2">
                      {property.statusType}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-400 line-clamp-1">
                    <MapPin className="h-3.5 w-3.5 inline mr-1" />
                    <span>
                      {property.address}, {property.addressCity}, {property.addressState} {property.addressZipcode}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-lg font-semibold text-[#FF7A00]">
                      {formatPriceRange(property.units)}
                    </p>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {property.units.slice(0, 3).map((unit, idx) => (
                      <Badge key={idx} variant="outline" className="bg-[#0f1d31]">
                        {unit.beds} {parseInt(unit.beds) === 1 ? 'Bed' : 'Beds'}
                        {unit.baths && `, ${unit.baths} ${parseFloat(unit.baths) === 1 ? 'Bath' : 'Baths'}`}
                      </Badge>
                    ))}
                    {property.units.length > 3 && (
                      <Badge variant="outline" className="bg-[#0f1d31]">
                        +{property.units.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div className="text-sm text-gray-400">Property Type: {property.propertyType}</div>
                  <Button variant="link" className="p-0 text-[#FF7A00]">
                    Analyze
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}