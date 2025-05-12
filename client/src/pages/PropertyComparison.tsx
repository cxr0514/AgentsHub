import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Property } from '@shared/schema';
import PropertyComparisonTable from '@/components/PropertyComparisonTable';
import { Input } from '@/components/ui/input';
import { Search, Filter, ArrowLeftRight, ChevronLeft, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'wouter';

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
  
  // State for showing/hiding the comparison view
  const [showComparison, setShowComparison] = useState(false);
  
  // Toggle comparison view
  const startComparison = () => {
    if (selectedPropertyIds.length > 0) {
      setShowComparison(true);
    }
  };
  
  // Go back to selection
  const backToSelection = () => {
    setShowComparison(false);
  };

  return (
    <>
      <Helmet>
        <title>Property Comparison | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="Compare multiple properties side by side to make informed investment decisions." />
      </Helmet>
      
      <div className="container max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 py-6 bg-[#071224] text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <Button variant="ghost" size="sm" className="gap-1 text-white hover:text-white/80">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Properties Comparison</h1>
          </div>
        </div>
        
        {showComparison ? (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={backToSelection}
                className="text-white hover:text-white/80"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Selection
              </Button>
              <div className="text-sm text-white/70">
                Comparing {selectedPropertyIds.length} {selectedPropertyIds.length === 1 ? 'property' : 'properties'}
              </div>
            </div>
            <PropertyComparisonTable 
              properties={selectedProperties || []}
              onRemoveProperty={removeProperty}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Select Properties</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/70" />
                      <Input
                        type="text"
                        placeholder="Search properties..."
                        className="pl-8 bg-slate-800 border-[#FF7A00]/20 text-white placeholder:text-white/50 focus:border-[#FF7A00]/50 focus:ring-[#FF7A00]/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#FF7A00]/30 bg-[#FF7A00]/10 hover:bg-[#FF7A00]/20 hover:border-[#FF7A00]/50"
                    >
                      <Filter className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-white/70">
                      {selectedPropertyIds.length} of 4 properties selected
                    </div>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={startComparison}
                      disabled={selectedPropertyIds.length === 0}
                      className="bg-[#FF7A00] hover:bg-[#FF7A00]/80 text-white"
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-1" />
                      Compare
                    </Button>
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
                          className={`flex items-start p-2 rounded-md mb-1 hover:bg-[#FF7A00]/10 cursor-pointer transition-colors ${
                            selectedPropertyIds.includes(property.id) ? 'bg-[#FF7A00]/10 border border-[#FF7A00]/30' : ''
                          }`}
                          onClick={() => togglePropertySelection(property.id)}
                        >
                          <Checkbox
                            checked={selectedPropertyIds.includes(property.id)}
                            onCheckedChange={() => togglePropertySelection(property.id)}
                            className="mr-3 mt-1 border-[#FF7A00]/50 data-[state=checked]:bg-[#FF7A00] data-[state=checked]:border-[#FF7A00]"
                          />
                          <div>
                            <div className="font-medium">{property.address}</div>
                            <div className="text-sm text-white/70">
                              {property.city}, {property.state} {property.zipCode}
                            </div>
                            <div className="flex gap-4 mt-1">
                              <div className="text-sm text-[#FF7A00] font-medium">
                                {formatCurrency(Number(property.price))}
                              </div>
                              <div className="text-sm text-white/60">
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
              <Card className="mb-4 bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">How to Compare Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal ml-4 space-y-2">
                    <li>Select up to 4 properties from the list on the left.</li>
                    <li>Click the "Compare" button to view the detailed comparison.</li>
                    <li>Analyze key metrics like price per square foot and features.</li>
                    <li>Remove properties from comparison by clicking the trash icon.</li>
                  </ol>
                </CardContent>
              </Card>
              
              {selectedPropertyIds.length > 0 && (
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Selected Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedProperties?.map((property: Property) => (
                        <div key={property.id} className="flex justify-between items-center p-2 border-b border-slate-700 last:border-0">
                          <div>
                            <div className="font-medium text-[#FF7A00]">{property.address}</div>
                            <div className="text-sm text-white/70">
                              <span className="text-white/90">{formatCurrency(Number(property.price))}</span> · {property.bedrooms} bed · {property.bathrooms} bath
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeProperty(property.id)}
                            className="text-white/70 hover:text-[#FF7A00] transition-colors"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button 
                        className="w-full bg-[#FF7A00] hover:bg-[#FF7A00]/80 text-white" 
                        onClick={startComparison}
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Start Comparison
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PropertyComparison;