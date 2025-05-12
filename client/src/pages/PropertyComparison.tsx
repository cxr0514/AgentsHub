import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Property } from '@shared/schema';
import PropertyComparisonTable from '@/components/PropertyComparisonTable';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PropertyComparison = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  
  // Fetch all properties
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return await response.json();
    }
  });
  
  // Filter properties by search query
  const filteredProperties = properties?.filter((property: Property) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.state.toLowerCase().includes(searchLower) ||
      property.zipCode.toLowerCase().includes(searchLower) ||
      property.propertyType.toLowerCase().includes(searchLower)
    );
  });
  
  // Get selected properties
  const selectedProperties = properties?.filter((property: Property) => 
    selectedPropertyIds.includes(property.id)
  );
  
  // Toggle property selection
  const togglePropertySelection = (propertyId: number) => {
    if (selectedPropertyIds.includes(propertyId)) {
      setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== propertyId));
    } else {
      // Limit to 4 properties for comparison
      if (selectedPropertyIds.length < 4) {
        setSelectedPropertyIds([...selectedPropertyIds, propertyId]);
      }
    }
  };
  
  // Remove property from comparison
  const removeProperty = (propertyId: number) => {
    setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== propertyId));
  };
  
  return (
    <>
      <Helmet>
        <title>Property Comparison | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="Compare multiple properties side by side to make informed investment decisions." />
      </Helmet>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Property Comparison</h1>
          <p className="text-text-secondary">
            Select up to 4 properties to compare side by side
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search properties..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  {selectedPropertyIds.length} of 4 properties selected
                </div>
                
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="animate-pulse flex p-2">
                        <div className="w-4 h-4 bg-muted rounded mr-3 mt-1"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProperties?.length > 0 ? (
                  <div className="max-h-[500px] overflow-y-auto pr-1">
                    {filteredProperties.map((property: Property) => (
                      <div 
                        key={property.id} 
                        className={`flex items-start p-2 rounded-md mb-1 hover:bg-muted cursor-pointer ${
                          selectedPropertyIds.includes(property.id) ? 'bg-muted/60' : ''
                        }`}
                        onClick={() => togglePropertySelection(property.id)}
                      >
                        <Checkbox
                          checked={selectedPropertyIds.includes(property.id)}
                          onCheckedChange={() => togglePropertySelection(property.id)}
                          className="mr-3 mt-1"
                        />
                        <div>
                          <div className="font-medium">{property.address}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.city}, {property.state} {property.zipCode}
                          </div>
                          <div className="flex gap-4 mt-1">
                            <div className="text-sm">
                              {formatCurrency(Number(property.price))}
                            </div>
                            <div className="text-sm">
                              {property.bedrooms} bed | {property.bathrooms} bath | {property.squareFeet} sqft
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p>No properties match your search.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <PropertyComparisonTable 
              properties={selectedProperties || []}
              onRemoveProperty={removeProperty}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyComparison;