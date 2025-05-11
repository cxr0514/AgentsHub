import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Slider
} from "@/components/ui/slider";
import PropertyCard from "./PropertyCard";
import PropertyTable from "./PropertyTable";
import { Property } from "@shared/schema";
import { Loader2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CompMatchingEngineProps {
  propertyId?: number;  // Optional: If we're matching comps for a specific subject property
  onCompsSelected?: (comps: Property[]) => void; // Callback when comps are selected
}

const CompMatchingEngine = ({ propertyId, onCompsSelected }: CompMatchingEngineProps) => {
  // Subject property (if not provided via propertyId)
  const [subjectProperty, setSubjectProperty] = useState<Property | null>(null);
  
  // Matching criteria
  const [matchCriteria, setMatchCriteria] = useState({
    radius: 5, // miles
    bedsRange: 1, // ±1 bed
    bathsRange: 1, // ±1 bath
    sqftRange: 20, // ±20% sqft
    priceRange: 20, // ±20% price
    ageRange: 10, // ±10 years
    lotSizeRange: 20, // ±20% lot size
    daysOnMarket: 180, // days (for sales)
    requireBasement: false,
    requireGarage: false,
    propertyType: "Same" // Same, Any, or specific type
  });
  
  // Selected comps
  const [selectedComps, setSelectedComps] = useState<Property[]>([]);
  
  // Status filters
  const [statusFilters, setStatusFilters] = useState({
    active: true,
    pending: true,
    sold: true
  });
  
  // Current tab
  const [activeTab, setActiveTab] = useState<string>("setup");
  
  // Loading state
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Fetch subject property if propertyId is provided
  const { data: subjectPropertyData, isLoading: isLoadingSubject } = useQuery({
    queryKey: ['/api/properties', propertyId],
    enabled: !!propertyId
  });
  
  // Search results
  const [searchResults, setSearchResults] = useState<{
    active: Property[],
    pending: Property[],
    sold: Property[]
  }>({
    active: [],
    pending: [],
    sold: []
  });
  
  // ARV and MAO calculations
  const [arv, setArv] = useState<{
    value: number | null,
    multiplier: number, // default multiplier
    adjustedArv: number | null
  }>({
    value: null,
    multiplier: 0.7, // 70% rule for real estate investing
    adjustedArv: null
  });
  
  // Update ARV based on selected comps
  const calculateARV = (comps: Property[]) => {
    if (comps.length === 0) return null;
    
    // Calculate average price of sold comparable properties
    const soldComps = comps.filter(comp => comp.status === "Sold");
    
    if (soldComps.length === 0) return null;
    
    // Calculate average price
    const totalPrice = soldComps.reduce((sum, comp) => sum + parseFloat(comp.price.toString()), 0);
    const averagePrice = totalPrice / soldComps.length;
    
    setArv({
      ...arv,
      value: averagePrice,
      adjustedArv: averagePrice * arv.multiplier
    });
    
    return averagePrice;
  };
  
  // Update subject property when data is loaded
  if (propertyId && subjectPropertyData && !subjectProperty) {
    setSubjectProperty(subjectPropertyData);
  }
  
  // Generate filters for comp search based on subject property and criteria
  const generateCompFilters = () => {
    if (!subjectProperty) return null;
    
    // Extract values from subject property
    const {
      bedrooms,
      bathrooms,
      squareFeet,
      price,
      yearBuilt,
      lotSize,
      propertyType: subjectPropertyType,
      latitude,
      longitude
    } = subjectProperty;
    
    // Calculate ranges
    const minBeds = Math.max(1, Number(bedrooms) - matchCriteria.bedsRange);
    const maxBeds = Number(bedrooms) + matchCriteria.bedsRange;
    
    const minBaths = Math.max(1, Number(bathrooms) - matchCriteria.bathsRange);
    const maxBaths = Number(bathrooms) + matchCriteria.bathsRange;
    
    const sqftValue = Number(squareFeet);
    const sqftPercent = matchCriteria.sqftRange / 100;
    const minSqft = Math.floor(sqftValue * (1 - sqftPercent));
    const maxSqft = Math.ceil(sqftValue * (1 + sqftPercent));
    
    const priceValue = Number(price);
    const pricePercent = matchCriteria.priceRange / 100;
    const minPrice = Math.floor(priceValue * (1 - pricePercent));
    const maxPrice = Math.ceil(priceValue * (1 + pricePercent));
    
    // Year built range
    let minYear = 0;
    let maxYear = 0;
    if (yearBuilt) {
      minYear = Number(yearBuilt) - matchCriteria.ageRange;
      maxYear = Number(yearBuilt) + matchCriteria.ageRange;
    }
    
    // Determine which statuses to include
    const statusList = [];
    if (statusFilters.active) statusList.push("Active");
    if (statusFilters.pending) statusList.push("Pending");
    if (statusFilters.sold) statusList.push("Sold");
    
    // Build the filter object
    const filters: any = {
      minBeds,
      maxBeds,
      minBaths,
      maxBaths,
      minSqft,
      maxSqft,
      minPrice,
      maxPrice,
      statusList,
    };
    
    // Only add year built filter if the subject property has this data
    if (yearBuilt) {
      filters.minYearBuilt = minYear;
      filters.maxYearBuilt = maxYear;
    }
    
    // Add property type filter if set to "Same"
    if (matchCriteria.propertyType === "Same" && subjectPropertyType) {
      filters.propertyType = subjectPropertyType;
    } else if (matchCriteria.propertyType !== "Any") {
      filters.propertyType = matchCriteria.propertyType;
    }
    
    // Add location-based search if we have coordinates
    if (latitude && longitude) {
      filters.lat = latitude;
      filters.lng = longitude;
      filters.radius = matchCriteria.radius;
    }
    
    // Add optional criteria
    if (matchCriteria.requireBasement) {
      filters.hasBasement = true;
    }
    
    if (matchCriteria.requireGarage) {
      filters.hasGarage = true;
    }
    
    // For sold properties, add date range filter (past N days)
    if (statusFilters.sold) {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - matchCriteria.daysOnMarket);
      
      filters.saleDateStart = pastDate.toISOString().split('T')[0];
      filters.saleDateEnd = today.toISOString().split('T')[0];
    }
    
    return filters;
  };
  
  // Search for comparable properties
  const searchComps = async () => {
    const filters = generateCompFilters();
    
    if (!filters) {
      toast({
        title: "Missing subject property",
        description: "Please select a subject property first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Make API call to search properties with our filters
      const response = await fetch('/api/properties/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filters })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch comparable properties');
      }
      
      const data = await response.json();
      
      // Organize results by status
      const results = {
        active: data.filter((p: Property) => p.status === 'Active'),
        pending: data.filter((p: Property) => p.status === 'Pending'),
        sold: data.filter((p: Property) => p.status === 'Sold')
      };
      
      setSearchResults(results);
      
      // Calculate ARV if we have sold comps
      calculateARV(results.sold);
      
      // Switch to results tab
      setActiveTab("results");
      
    } catch (error) {
      console.error('Error searching for comps:', error);
      toast({
        title: "Error finding comps",
        description: "There was a problem searching for comparable properties",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Toggle comp selection
  const toggleCompSelection = (property: Property) => {
    if (selectedComps.some(p => p.id === property.id)) {
      setSelectedComps(selectedComps.filter(p => p.id !== property.id));
    } else {
      setSelectedComps([...selectedComps, property]);
    }
  };
  
  // Apply selection and notify parent component
  const applySelection = () => {
    if (onCompsSelected && selectedComps.length > 0) {
      onCompsSelected(selectedComps);
      
      toast({
        title: "Comps selected",
        description: `Selected ${selectedComps.length} comparable properties`,
        variant: "default"
      });
    }
  };
  
  // Update matching criteria
  const updateCriteria = (key: string, value: any) => {
    setMatchCriteria({
      ...matchCriteria,
      [key]: value
    });
  };
  
  // Toggle status filter
  const toggleStatus = (status: 'active' | 'pending' | 'sold') => {
    setStatusFilters({
      ...statusFilters,
      [status]: !statusFilters[status]
    });
  };
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        
        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Property</CardTitle>
              <CardDescription>
                {subjectProperty ? 
                  `${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state}` : 
                  "Select or enter the subject property details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubject ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : subjectProperty ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{subjectProperty.address}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subjectProperty.bedrooms} beds · {subjectProperty.bathrooms} baths · {Number(subjectProperty.squareFeet).toLocaleString()} sqft
                      </p>
                      <p className="text-lg font-semibold">${Number(subjectProperty.price).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSubjectProperty(null as any)}>Change</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please select a subject property from the system or enter a property address to search.
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter property address" 
                      className="flex-1"
                    />
                    <Button variant="secondary">
                      <Search className="h-4 w-4 mr-2" />
                      Find Property
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Matching Criteria</CardTitle>
              <CardDescription>
                Adjust the criteria to find the best comparable properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Location Radius */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Location Radius</label>
                    <span className="text-sm text-muted-foreground">{matchCriteria.radius} miles</span>
                  </div>
                  <Slider
                    value={[matchCriteria.radius]}
                    min={1}
                    max={25}
                    step={1}
                    onValueChange={(values) => updateCriteria('radius', values[0])}
                  />
                </div>
                
                {/* Property Characteristics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bedrooms Range (±)</label>
                    <Select 
                      value={matchCriteria.bedsRange.toString()} 
                      onValueChange={(value) => updateCriteria('bedsRange', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Exact match</SelectItem>
                        <SelectItem value="1">±1 bedroom</SelectItem>
                        <SelectItem value="2">±2 bedrooms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bathrooms Range (±)</label>
                    <Select 
                      value={matchCriteria.bathsRange.toString()} 
                      onValueChange={(value) => updateCriteria('bathsRange', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Exact match</SelectItem>
                        <SelectItem value="1">±1 bathroom</SelectItem>
                        <SelectItem value="2">±2 bathrooms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Square Footage Range</label>
                      <span className="text-sm text-muted-foreground">±{matchCriteria.sqftRange}%</span>
                    </div>
                    <Slider
                      value={[matchCriteria.sqftRange]}
                      min={5}
                      max={50}
                      step={5}
                      onValueChange={(values) => updateCriteria('sqftRange', values[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Price Range</label>
                      <span className="text-sm text-muted-foreground">±{matchCriteria.priceRange}%</span>
                    </div>
                    <Slider
                      value={[matchCriteria.priceRange]}
                      min={5}
                      max={50}
                      step={5}
                      onValueChange={(values) => updateCriteria('priceRange', values[0])}
                    />
                  </div>
                </div>
                
                {/* Property Features */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Features</label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="require-basement" 
                        checked={matchCriteria.requireBasement}
                        onCheckedChange={(checked) => updateCriteria('requireBasement', !!checked)}
                      />
                      <label htmlFor="require-basement" className="text-sm">Require Basement</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="require-garage" 
                        checked={matchCriteria.requireGarage}
                        onCheckedChange={(checked) => updateCriteria('requireGarage', !!checked)}
                      />
                      <label htmlFor="require-garage" className="text-sm">Require Garage</label>
                    </div>
                  </div>
                </div>
                
                {/* Property Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  <Select 
                    value={matchCriteria.propertyType} 
                    onValueChange={(value) => updateCriteria('propertyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Same">Same as subject property</SelectItem>
                      <SelectItem value="Any">Any property type</SelectItem>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                      <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Include Property Status</label>
                  <div className="flex flex-wrap gap-2">
                    <div 
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                        statusFilters.active 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => toggleStatus('active')}
                    >
                      Active
                    </div>
                    <div 
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                        statusFilters.pending 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => toggleStatus('pending')}
                    >
                      Pending
                    </div>
                    <div 
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                        statusFilters.sold 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => toggleStatus('sold')}
                    >
                      Sold
                    </div>
                  </div>
                </div>
                
                {/* Days on Market (for sold comps) */}
                {statusFilters.sold && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Sold Within (days)</label>
                      <span className="text-sm text-muted-foreground">{matchCriteria.daysOnMarket} days</span>
                    </div>
                    <Slider
                      value={[matchCriteria.daysOnMarket]}
                      min={30}
                      max={365}
                      step={30}
                      onValueChange={(values) => updateCriteria('daysOnMarket', values[0])}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={searchComps} 
                  disabled={!subjectProperty || isSearching}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>Find Comparable Properties</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparable Properties</CardTitle>
              <CardDescription>
                {Object.values(searchResults).flat().length} properties found based on your criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="active" className="flex gap-2">
                    Active
                    <span className="bg-gray-100 text-xs rounded-full px-2 py-0.5">
                      {searchResults.active.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex gap-2">
                    Pending
                    <span className="bg-gray-100 text-xs rounded-full px-2 py-0.5">
                      {searchResults.pending.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="sold" className="flex gap-2">
                    Sold
                    <span className="bg-gray-100 text-xs rounded-full px-2 py-0.5">
                      {searchResults.sold.length}
                    </span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="py-4">
                  {searchResults.active.length > 0 ? (
                    <PropertyTable 
                      properties={searchResults.active} 
                      title="Active Comparable Properties"
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No active properties match your criteria
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="pending" className="py-4">
                  {searchResults.pending.length > 0 ? (
                    <PropertyTable 
                      properties={searchResults.pending} 
                      title="Pending Comparable Properties"
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending properties match your criteria
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="sold" className="py-4">
                  {searchResults.sold.length > 0 ? (
                    <PropertyTable 
                      properties={searchResults.sold} 
                      title="Sold Comparable Properties"
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No sold properties match your criteria
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              {Object.values(searchResults).flat().length > 0 && (
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("setup")}
                  >
                    Adjust Criteria
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("analysis")}
                    disabled={searchResults.sold.length === 0}
                  >
                    Run Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CMA Analysis</CardTitle>
              <CardDescription>
                Valuation analysis based on comparable properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {searchResults.sold.length > 0 ? (
                  <>
                    {/* ARV Calculation */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">ARV (After Repair Value)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">
                            Comparable Average
                          </div>
                          <div className="text-2xl font-bold">
                            ${arv.value ? Math.round(arv.value).toLocaleString() : "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Based on {searchResults.sold.length} sold properties
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm text-muted-foreground">
                              ARV Multiplier
                            </div>
                            <div className="text-sm font-medium">
                              {(arv.multiplier * 100).toFixed(0)}%
                            </div>
                          </div>
                          <Slider
                            value={[arv.multiplier * 100]}
                            min={50}
                            max={100}
                            step={5}
                            onValueChange={(values) => setArv({
                              ...arv,
                              multiplier: values[0] / 100,
                              adjustedArv: arv.value ? arv.value * (values[0] / 100) : null
                            })}
                          />
                          <div className="text-xs text-muted-foreground mt-2">
                            Adjust the multiplier for your investment strategy
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">
                            Maximum Allowable Offer (MAO)
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            ${arv.adjustedArv ? Math.round(arv.adjustedArv).toLocaleString() : "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Based on {(arv.multiplier * 100).toFixed(0)}% of ARV
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Property Comparison */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Property Comparison</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-4 py-2 text-left">Property</th>
                              <th className="px-4 py-2 text-right">Price</th>
                              <th className="px-4 py-2 text-right">Price/SqFt</th>
                              <th className="px-4 py-2 text-center">Beds</th>
                              <th className="px-4 py-2 text-center">Baths</th>
                              <th className="px-4 py-2 text-right">SqFt</th>
                              <th className="px-4 py-2 text-center">Year</th>
                              <th className="px-4 py-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Subject Property */}
                            {subjectProperty && (
                              <tr className="bg-primary bg-opacity-10 font-medium">
                                <td className="px-4 py-2 text-left">Subject</td>
                                <td className="px-4 py-2 text-right">
                                  ${Number(subjectProperty.price).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  ${Number(subjectProperty.pricePerSqft).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {subjectProperty.bedrooms}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {subjectProperty.bathrooms}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {Number(subjectProperty.squareFeet).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {subjectProperty.yearBuilt}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {subjectProperty.status}
                                </td>
                              </tr>
                            )}
                            
                            {/* Top Comps */}
                            {searchResults.sold.slice(0, 5).map((property, index) => (
                              <tr key={property.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="px-4 py-2 text-left">
                                  {property.address}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  ${Number(property.price).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  ${Number(property.pricePerSqft).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {property.bedrooms}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {property.bathrooms}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {Number(property.squareFeet).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {property.yearBuilt}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {property.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No sold comparable properties available for analysis. 
                    <div className="mt-2">
                      <Button 
                        variant="outline"
                        onClick={() => setActiveTab("setup")}
                      >
                        Adjust Search Criteria
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {searchResults.sold.length > 0 && (
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("results")}
                  >
                    Back to Results
                  </Button>
                  <Button 
                    onClick={applySelection}
                    disabled={selectedComps.length === 0}
                  >
                    Generate CMA Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompMatchingEngine;