import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import SimpleMapHeatmap from "@/components/SimpleMapHeatmap";
import { ArrowLeft, Search, Layers, MapPin, Filter, LayoutGrid, InfoIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const MapVisualizationPage = () => {
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState({
    location: "",
    propertyType: "All",
    priceRange: [100000, 1000000] as [number, number],
    bedsMin: 0,
    bathsMin: 0,
    sqftMin: 0,
    showHeatmap: true,
    showProperties: true
  });
  const [activeMapTab, setActiveMapTab] = useState("map");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Fetch properties based on search params
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties', searchParams],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams();
      if (searchParams.location) params.append('location', searchParams.location);
      if (searchParams.propertyType !== 'All') params.append('propertyType', searchParams.propertyType);
      params.append('minPrice', searchParams.priceRange[0].toString());
      params.append('maxPrice', searchParams.priceRange[1].toString());
      if (searchParams.bedsMin > 0) params.append('minBeds', searchParams.bedsMin.toString());
      if (searchParams.bathsMin > 0) params.append('minBaths', searchParams.bathsMin.toString());
      if (searchParams.sqftMin > 0) params.append('minSqft', searchParams.sqftMin.toString());
      
      const response = await apiRequest('GET', `/api/properties?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Handle property click on map
  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setActiveMapTab("details");
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-fetch with current search params
    // React Query will automatically refetch with the new queryKey
  };
  
  // Update search param
  const updateSearchParam = (key: keyof typeof searchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <>
      <Helmet>
        <title>Map Visualization | Real Estate Pro</title>
        <meta name="description" content="Interactive map with market heatmaps and property visualization." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" asChild>
              <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-[#071224]">Market Map</h1>
            <p className="text-muted-foreground">
              Visualize market trends and property locations
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar - Search filters */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="bg-[#071224] text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center">
                  <Search className="h-5 w-5 mr-2 text-[#FF7A00]" />
                  Search Filters
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Refine your property search
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, ZIP, or Address"
                      value={searchParams.location}
                      onChange={(e) => updateSearchParam('location', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="property-type">Property Type</Label>
                    <Select
                      value={searchParams.propertyType}
                      onValueChange={(value) => updateSearchParam('propertyType', value)}
                    >
                      <SelectTrigger id="property-type">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Properties</SelectItem>
                        <SelectItem value="Single Family">Single Family</SelectItem>
                        <SelectItem value="Condo">Condo/Townhome</SelectItem>
                        <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                        <SelectItem value="Land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Price Range</Label>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(searchParams.priceRange[0])} - {formatPrice(searchParams.priceRange[1])}
                      </span>
                    </div>
                    <Slider
                      value={searchParams.priceRange}
                      min={0}
                      max={2000000}
                      step={10000}
                      onValueChange={(value) => updateSearchParam('priceRange', value)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>$2M+</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="beds">Beds</Label>
                      <Select
                        value={searchParams.bedsMin.toString()}
                        onValueChange={(value) => updateSearchParam('bedsMin', parseInt(value))}
                      >
                        <SelectTrigger id="beds">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                          <SelectItem value="5">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="baths">Baths</Label>
                      <Select
                        value={searchParams.bathsMin.toString()}
                        onValueChange={(value) => updateSearchParam('bathsMin', parseInt(value))}
                      >
                        <SelectTrigger id="baths">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                          <SelectItem value="5">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sqft">Sq Ft</Label>
                      <Select
                        value={searchParams.sqftMin.toString()}
                        onValueChange={(value) => updateSearchParam('sqftMin', parseInt(value))}
                      >
                        <SelectTrigger id="sqft">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any</SelectItem>
                          <SelectItem value="500">500+</SelectItem>
                          <SelectItem value="1000">1,000+</SelectItem>
                          <SelectItem value="1500">1,500+</SelectItem>
                          <SelectItem value="2000">2,000+</SelectItem>
                          <SelectItem value="3000">3,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Map Display</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="show-heatmap" className="text-sm font-normal">Show Heatmap</Label>
                      </div>
                      <Switch
                        id="show-heatmap"
                        checked={searchParams.showHeatmap}
                        onCheckedChange={(checked) => updateSearchParam('showHeatmap', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="show-properties" className="text-sm font-normal">Show Properties</Label>
                      </div>
                      <Switch
                        id="show-properties"
                        checked={searchParams.showProperties}
                        onCheckedChange={(checked) => updateSearchParam('showProperties', checked)}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Search Map
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Result stats */}
            {!isLoading && properties && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Results</h3>
                      <p className="text-sm text-muted-foreground">
                        {properties.length} properties found
                      </p>
                    </div>
                    <Badge className="bg-[#071224]">
                      {searchParams.location || "All Locations"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Main content area - Map and property details */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <Tabs value={activeMapTab} onValueChange={setActiveMapTab}>
                <div className="flex justify-between items-center p-4 border-b">
                  <TabsList>
                    <TabsTrigger value="map" className="flex items-center">
                      <Layers className="h-4 w-4 mr-2" />
                      Map View
                    </TabsTrigger>
                    <TabsTrigger value="grid" className="flex items-center">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid View
                    </TabsTrigger>
                    {selectedProperty && (
                      <TabsTrigger value="details" className="flex items-center">
                        <InfoIcon className="h-4 w-4 mr-2" />
                        Property Details
                      </TabsTrigger>
                    )}
                  </TabsList>
                  
                  <div className="flex items-center">
                    <Button variant="outline" size="sm" className="ml-2">
                      <Filter className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Filters</span>
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="map" className="m-0 p-0">
                  <div className="h-[calc(100vh-16rem)]">
                    <SimpleMapHeatmap height="100%" />
                  </div>
                </TabsContent>
                
                <TabsContent value="grid" className="m-0 p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <p>Loading properties...</p>
                    </div>
                  ) : properties && properties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {properties.map((property) => (
                        <Card 
                          key={property.id} 
                          className="overflow-hidden cursor-pointer hover:border-primary"
                          onClick={() => handlePropertyClick(property)}
                        >
                          <div 
                            className="h-40 bg-muted bg-cover bg-center"
                            style={{
                              backgroundImage: property.images 
                                ? `url(${Array.isArray(property.images) 
                                    ? property.images[0] 
                                    : typeof property.images === 'object' && property.images 
                                      ? Object.values(property.images)[0] 
                                      : ''
                                  })`
                                : ''
                            }}
                          />
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-1 line-clamp-1">{property.address}</h3>
                            <p className="text-xl font-bold text-[#071224] mb-1">
                              {formatPrice(Number(property.price))}
                            </p>
                            <div className="text-sm text-muted-foreground flex space-x-2">
                              <span>{property.bedrooms} bed</span>
                              <span>•</span>
                              <span>{property.bathrooms} bath</span>
                              <span>•</span>
                              <span>{property.squareFeet} sq ft</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      <p className="text-muted-foreground mb-4">No properties found matching your criteria.</p>
                      <Button 
                        variant="outline"
                        onClick={() => setSearchParams({
                          location: "",
                          propertyType: "All",
                          priceRange: [100000, 1000000],
                          bedsMin: 0,
                          bathsMin: 0,
                          sqftMin: 0,
                          showHeatmap: true,
                          showProperties: true
                        })}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="details" className="m-0">
                  {selectedProperty ? (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">{selectedProperty.address}</h2>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/properties/${selectedProperty.id}`)}
                        >
                          View Full Details
                        </Button>
                      </div>
                      
                      <div
                        className="h-56 bg-muted rounded-md bg-cover bg-center mb-4"
                        style={{
                          backgroundImage: selectedProperty.images 
                            ? `url(${Array.isArray(selectedProperty.images) 
                                ? selectedProperty.images[0] 
                                : typeof selectedProperty.images === 'object' && selectedProperty.images 
                                  ? Object.values(selectedProperty.images)[0] 
                                  : ''
                              })`
                            : ''
                        }}
                      />
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-3xl font-bold text-[#071224]">
                            {formatPrice(Number(selectedProperty.price))}
                          </h3>
                          <p className="text-muted-foreground">
                            {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                          </p>
                        </div>
                        
                        <div className="flex justify-end items-center space-x-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{selectedProperty.bedrooms}</p>
                            <p className="text-sm text-muted-foreground">Beds</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{selectedProperty.bathrooms}</p>
                            <p className="text-sm text-muted-foreground">Baths</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{selectedProperty.squareFeet}</p>
                            <p className="text-sm text-muted-foreground">Sq Ft</p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Property Type</p>
                          <p className="font-medium">{selectedProperty.propertyType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Year Built</p>
                          <p className="font-medium">{selectedProperty.yearBuilt || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium">{selectedProperty.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price/Sq Ft</p>
                          <p className="font-medium">
                            {formatPrice(Number(selectedProperty.price) / Number(selectedProperty.squareFeet))}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => setActiveMapTab("map")}
                        >
                          Back to Map
                        </Button>
                        <Button
                          className="bg-[#071224] hover:bg-[#0f1d31] text-white"
                          onClick={() => setLocation(`/properties/${selectedProperty.id}`)}
                        >
                          View Full Details
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p>No property selected</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default MapVisualizationPage;