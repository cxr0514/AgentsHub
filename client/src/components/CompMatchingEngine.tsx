import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  Search, 
  Filter, 
  Map, 
  ArrowRight, 
  PencilRuler, 
  Sliders, 
  Save, 
  FileOutput, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Building,
  Bed,
  Bath,
  Grid2X2,
  Calendar,
  DollarSign,
  SquareStack,
  Loader2,
  Info
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType: string;
  status: string;
  daysOnMarket?: number;
  pricePerSqft?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
  hasBasement?: boolean;
  hasGarage?: boolean;
  garageSpaces?: number;
}

interface CompCriteria {
  propertyId?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  radius: number;
  minBeds: number;
  maxBeds: number;
  minBaths: number;
  maxBaths: number;
  minSqft: number;
  maxSqft: number;
  minLotSize?: number;
  maxLotSize?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  propertyType: string;
  status: string;
  saleTimeframe?: number; // Sale within last X months
  priceRange: number; // Percentage +/- from subject property
  maxResults: number;
}

interface CompAdjustment {
  propertyId: number;
  adjustments: {
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    squareFeet?: number | undefined;
    lotSize?: number | undefined;
    age?: number | undefined;
    garage?: number | undefined;
    basement?: boolean | undefined;
    location?: number | undefined;
    condition?: number | undefined;
    other?: number | undefined;
  };
  adjustedPrice: number;
  adjustmentNotes?: string;
}

// Default values for comp criteria
const defaultCompCriteria: CompCriteria = {
  radius: 3,
  minBeds: 2,
  maxBeds: 4,
  minBaths: 1,
  maxBaths: 3,
  minSqft: 1000,
  maxSqft: 3000,
  propertyType: 'single-family',
  status: 'sold',
  saleTimeframe: 6,
  priceRange: 20,
  maxResults: 5
};

const propertyTypeOptions = [
  { value: 'single-family', label: 'Single Family' },
  { value: 'multi-family', label: 'Multi-Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
];

const statusOptions = [
  { value: 'sold', label: 'Sold' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
];

const saleTimeframeOptions = [
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
];

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to calculate price per square foot
const calculatePricePerSqFt = (price: number, sqft: number) => {
  if (!sqft) return 0;
  return Math.round(price / sqft);
};

export function CompMatchingEngine() {
  const { toast } = useToast();
  const [subjectProperty, setSubjectProperty] = useState<Property | null>(null);
  const [compCriteria, setCompCriteria] = useState<CompCriteria>(defaultCompCriteria);
  const [comps, setComps] = useState<Property[]>([]);
  const [selectedComps, setSelectedComps] = useState<Property[]>([]);
  const [compAdjustments, setCompAdjustments] = useState<Record<number, CompAdjustment>>({});
  const [activeTab, setActiveTab] = useState('search');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchZip, setSearchZip] = useState('');
  const [isSubjectPropertySelected, setIsSubjectPropertySelected] = useState(false);
  
  // Query to fetch properties based on search parameters
  const searchPropertiesMutation = useMutation({
    mutationFn: async (searchParams: { address?: string, city?: string, state?: string, zipCode?: string }) => {
      const response = await apiRequest('GET', `/api/properties/search?${new URLSearchParams({
        ...(searchParams.address ? { address: searchParams.address } : {}),
        ...(searchParams.city ? { city: searchParams.city } : {}),
        ...(searchParams.state ? { state: searchParams.state } : {}),
        ...(searchParams.zipCode ? { zipCode: searchParams.zipCode } : {})
      }).toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search properties');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.length === 0) {
        toast({
          title: 'No properties found',
          description: 'Try adjusting your search criteria',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Mutation to find comparable properties
  const findCompsMutation = useMutation({
    mutationFn: async (criteria: CompCriteria) => {
      const response = await apiRequest('POST', '/api/properties/find-comps', criteria);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to find comparable properties');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setComps(data.comps || []);
      if (data.comps.length === 0) {
        toast({
          title: 'No comps found',
          description: 'Try adjusting your criteria for a broader search',
          variant: 'destructive'
        });
      } else {
        setActiveTab('results');
        toast({
          title: 'Comps Found',
          description: `Found ${data.comps.length} comparable properties`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Comp Search Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Mutation to save comp adjustments
  const saveAdjustmentsMutation = useMutation({
    mutationFn: async (adjustmentsData: { subjectPropertyId: number, adjustments: Record<number, CompAdjustment> }) => {
      const response = await apiRequest('POST', '/api/properties/save-comp-adjustments', adjustmentsData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save adjustments');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Adjustments Saved',
        description: 'Your comp adjustments have been saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Handle selecting a property as the subject property
  const handleSelectSubjectProperty = (property: Property) => {
    setSubjectProperty(property);
    setIsSubjectPropertySelected(true);
    
    // Update comp criteria based on subject property
    setCompCriteria({
      ...compCriteria,
      propertyId: property.id,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      minBeds: Math.max(1, property.bedrooms - 1),
      maxBeds: property.bedrooms + 1,
      minBaths: Math.max(1, Math.floor(property.bathrooms - 1)),
      maxBaths: Math.ceil(property.bathrooms + 1),
      minSqft: Math.round(property.squareFeet * 0.8),
      maxSqft: Math.round(property.squareFeet * 1.2),
      propertyType: property.propertyType
    });
    
    setActiveTab('criteria');
  };
  
  // Handle search by address/location
  const handleSearch = () => {
    if (!searchAddress && !searchCity && !searchState && !searchZip) {
      toast({
        title: 'Search Error',
        description: 'Please enter at least one search parameter',
        variant: 'destructive'
      });
      return;
    }
    
    searchPropertiesMutation.mutate({
      address: searchAddress,
      city: searchCity,
      state: searchState,
      zipCode: searchZip
    });
  };
  
  // Handle finding comps
  const handleFindComps = () => {
    if (!subjectProperty) {
      toast({
        title: 'No Subject Property',
        description: 'Please select a subject property first',
        variant: 'destructive'
      });
      return;
    }
    
    findCompsMutation.mutate(compCriteria);
  };
  
  // Handle selecting a comp for comparison
  const handleSelectComp = (property: Property) => {
    // If already selected, remove it
    if (selectedComps.some(comp => comp.id === property.id)) {
      setSelectedComps(selectedComps.filter(comp => comp.id !== property.id));
      
      // Remove any adjustments for this property
      const newAdjustments = { ...compAdjustments };
      delete newAdjustments[property.id];
      setCompAdjustments(newAdjustments);
    } else {
      // Add to selected comps (limit to 5)
      if (selectedComps.length < 5) {
        setSelectedComps([...selectedComps, property]);
        
        // Initialize adjustments for this property
        setCompAdjustments({
          ...compAdjustments,
          [property.id]: {
            propertyId: property.id,
            adjustments: {},
            adjustedPrice: property.price
          }
        });
      } else {
        toast({
          title: 'Selection Limit',
          description: 'You can only select up to 5 comps for comparison',
          variant: 'destructive'
        });
      }
    }
  };
  
  // Handle adjustment changes
  const handleAdjustmentChange = (
    propertyId: number, 
    category: string, 
    value: number | boolean
  ) => {
    if (!subjectProperty) return;
    
    const selectedComp = selectedComps.find(comp => comp.id === propertyId);
    if (!selectedComp) return;
    
    // Create a copy of the current adjustments for this property
    const currentAdjustment = compAdjustments[propertyId] || {
      propertyId,
      adjustments: {},
      adjustedPrice: selectedComp.price
    };
    
    const newAdjustments = { ...currentAdjustment.adjustments };
    
    // Add or update the specific adjustment
    if (typeof value === 'number' && category !== 'basement') {
      // Cast to any to bypass TypeScript's strict checking
      (newAdjustments as any)[category] = value;
    } else if (typeof value === 'boolean' && category === 'basement') {
      // Cast to any to bypass TypeScript's strict checking
      (newAdjustments as any).basement = value;
    }
    
    // Calculate total adjustment amount
    let totalAdjustment = 0;
    // Only consider number values for the calculation
    Object.values(newAdjustments).forEach(adjustmentValue => {
      if (typeof adjustmentValue === 'number') {
        totalAdjustment += adjustmentValue;
      }
    });
    
    // Calculate adjusted price
    const adjustedPrice = selectedComp.price + totalAdjustment;
    
    // Update adjustments for this property
    setCompAdjustments({
      ...compAdjustments,
      [propertyId]: {
        ...currentAdjustment,
        adjustments: newAdjustments,
        adjustedPrice
      }
    });
  };
  
  // Handle saving adjustments
  const handleSaveAdjustments = () => {
    if (!subjectProperty) {
      toast({
        title: 'No Subject Property',
        description: 'Please select a subject property first',
        variant: 'destructive'
      });
      return;
    }
    
    if (Object.keys(compAdjustments).length === 0) {
      toast({
        title: 'No Adjustments',
        description: 'Please make adjustments to at least one comparable property',
        variant: 'destructive'
      });
      return;
    }
    
    saveAdjustmentsMutation.mutate({
      subjectPropertyId: subjectProperty.id,
      adjustments: compAdjustments
    });
  };
  
  // Helper function to calculate the adjustment difference
  const calculateAdjustmentDifference = (propertyId: number) => {
    const adjustment = compAdjustments[propertyId];
    if (!adjustment) return 0;
    
    const selectedComp = selectedComps.find(comp => comp.id === propertyId);
    if (!selectedComp) return 0;
    
    return adjustment.adjustedPrice - selectedComp.price;
  };
  
  // Generate a temporary property with sample comps for development
  const generateTemporaryProperty = () => {
    // Only use this for testing/development or when API is unavailable
    const tempProperty: Property = {
      id: 1,
      address: '123 Main St',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30303',
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2200,
      lotSize: 0.25,
      yearBuilt: 2005,
      propertyType: 'single-family',
      status: 'active',
      daysOnMarket: 15,
      pricePerSqft: 205,
      latitude: 33.7490,
      longitude: -84.3880,
      hasBasement: false,
      hasGarage: true,
      garageSpaces: 2
    };
    
    setSubjectProperty(tempProperty);
    setIsSubjectPropertySelected(true);
    
    // Update comp criteria based on subject property
    setCompCriteria({
      ...compCriteria,
      propertyId: tempProperty.id,
      address: tempProperty.address,
      city: tempProperty.city,
      state: tempProperty.state,
      zipCode: tempProperty.zipCode,
      minBeds: Math.max(1, tempProperty.bedrooms - 1),
      maxBeds: tempProperty.bedrooms + 1,
      minBaths: Math.max(1, Math.floor(tempProperty.bathrooms - 1)),
      maxBaths: Math.ceil(tempProperty.bathrooms + 1),
      minSqft: Math.round(tempProperty.squareFeet * 0.8),
      maxSqft: Math.round(tempProperty.squareFeet * 1.2),
      propertyType: tempProperty.propertyType
    });
    
    // Generate example comps
    const exampleComps: Property[] = [
      {
        id: 2,
        address: '456 Oak St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30303',
        price: 435000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2100,
        lotSize: 0.2,
        yearBuilt: 2003,
        propertyType: 'single-family',
        status: 'sold',
        daysOnMarket: 25,
        pricePerSqft: 207,
        hasBasement: false,
        hasGarage: true,
        garageSpaces: 1
      },
      {
        id: 3,
        address: '789 Pine St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30304',
        price: 475000,
        bedrooms: 4,
        bathrooms: 2.5,
        squareFeet: 2400,
        lotSize: 0.3,
        yearBuilt: 2007,
        propertyType: 'single-family',
        status: 'sold',
        daysOnMarket: 18,
        pricePerSqft: 198,
        hasBasement: true,
        hasGarage: true,
        garageSpaces: 2
      },
      {
        id: 4,
        address: '101 Elm St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30305',
        price: 425000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        lotSize: 0.22,
        yearBuilt: 2001,
        propertyType: 'single-family',
        status: 'sold',
        daysOnMarket: 30,
        pricePerSqft: 213,
        hasBasement: false,
        hasGarage: true,
        garageSpaces: 2
      },
      {
        id: 5,
        address: '222 Maple St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30303',
        price: 460000,
        bedrooms: 4,
        bathrooms: 2,
        squareFeet: 2300,
        lotSize: 0.25,
        yearBuilt: 2005,
        propertyType: 'single-family',
        status: 'sold',
        daysOnMarket: 22,
        pricePerSqft: 200,
        hasBasement: false,
        hasGarage: true,
        garageSpaces: 2
      },
      {
        id: 6,
        address: '333 Cedar St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30305',
        price: 440000,
        bedrooms: 3,
        bathrooms: 2.5,
        squareFeet: 2150,
        lotSize: 0.23,
        yearBuilt: 2006,
        propertyType: 'single-family',
        status: 'sold',
        daysOnMarket: 20,
        pricePerSqft: 205,
        hasBasement: true,
        hasGarage: true,
        garageSpaces: 2
      }
    ];
    
    setComps(exampleComps);
    setActiveTab('results');
  };
  
  return (
    <Card className="w-full bg-[#050e1d] border-[#0f1d31]">
      <CardHeader className="bg-[#071224] text-white">
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Home className="h-6 w-6 text-[#FF7A00]" />
          Comparable Property Matching Engine
        </CardTitle>
        <CardDescription className="text-slate-300">
          Find, compare, and adjust comparable properties for accurate valuations
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid grid-cols-4 w-full bg-[#071224]">
            <TabsTrigger value="search" className="flex items-center gap-2 data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              <Search className="h-4 w-4" />
              <span>Find Property</span>
            </TabsTrigger>
            <TabsTrigger value="criteria" className="flex items-center gap-2 data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white" disabled={!isSubjectPropertySelected}>
              <Filter className="h-4 w-4" />
              <span>Comp Criteria</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2 data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white" disabled={comps.length === 0}>
              <SquareStack className="h-4 w-4" />
              <span>Comp Results</span>
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="flex items-center gap-2 data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white" disabled={selectedComps.length === 0}>
              <Sliders className="h-4 w-4" />
              <span>Adjustments</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6 bg-[#050e1d] text-slate-300">
          {/* Find Property Tab */}
          <TabsContent value="search" className="mt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="searchAddress" className="text-white">Property Address</Label>
                  <Input 
                    id="searchAddress" 
                    placeholder="123 Main St" 
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="searchCity" className="text-white">City</Label>
                  <Input 
                    id="searchCity" 
                    placeholder="Atlanta" 
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="searchState" className="text-white">State</Label>
                  <Input 
                    id="searchState" 
                    placeholder="GA" 
                    value={searchState}
                    onChange={(e) => setSearchState(e.target.value)}
                    className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="searchZip" className="text-white">ZIP Code</Label>
                  <Input 
                    id="searchZip" 
                    placeholder="30303" 
                    value={searchZip}
                    onChange={(e) => setSearchZip(e.target.value)}
                    className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={generateTemporaryProperty}
                  className="border-[#0f1d31] hover:bg-[#0f1d31] text-slate-300 gap-2"
                >
                  <Building className="h-4 w-4" />
                  Demo Mode
                </Button>
                
                <Button 
                  onClick={handleSearch}
                  className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white gap-2"
                  disabled={searchPropertiesMutation.isPending}
                >
                  {searchPropertiesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search Properties
                    </>
                  )}
                </Button>
              </div>
              
              {searchPropertiesMutation.isSuccess && searchPropertiesMutation.data?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4 text-white">Search Results</h3>
                  <div className="border border-[#0f1d31] rounded-md bg-[#071224]">
                    <Table>
                      <TableHeader className="bg-[#071224]">
                        <TableRow className="border-b border-[#0f1d31]">
                          <TableHead className="text-white">Address</TableHead>
                          <TableHead className="text-white">Price</TableHead>
                          <TableHead className="text-white">Beds/Baths</TableHead>
                          <TableHead className="text-white">Sq Ft</TableHead>
                          <TableHead className="text-white">Year</TableHead>
                          <TableHead className="text-white">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-[#071224]">
                        {searchPropertiesMutation.data.map((property: Property) => (
                          <TableRow key={property.id} className="border-b border-[#0f1d31] hover:bg-[#0f1d31]/20">
                            <TableCell className="text-white">
                              {property.address}, {property.city}, {property.state} {property.zipCode}
                            </TableCell>
                            <TableCell className="text-white">{formatCurrency(property.price)}</TableCell>
                            <TableCell className="text-white">{property.bedrooms}/{property.bathrooms}</TableCell>
                            <TableCell className="text-white">{property.squareFeet.toLocaleString()}</TableCell>
                            <TableCell className="text-white">{property.yearBuilt || 'N/A'}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm"
                                onClick={() => handleSelectSubjectProperty(property)}
                                className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white gap-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {/* If subject property has been selected, show it */}
              {subjectProperty && (
                <div className="mt-6">
                  <Alert className="bg-[#0f1d31]/20 border-[#0f1d31]/30 text-white">
                    <CheckCircle className="h-4 w-4 text-[#FF7A00]" />
                    <AlertTitle className="text-white font-medium">Subject Property Selected</AlertTitle>
                    <AlertDescription className="text-slate-300">
                      {subjectProperty.address}, {subjectProperty.city}, {subjectProperty.state} {subjectProperty.zipCode}
                      <div className="mt-2 text-sm text-slate-400">
                        {formatCurrency(subjectProperty.price)} • 
                        {subjectProperty.bedrooms} beds • 
                        {subjectProperty.bathrooms} baths • 
                        {subjectProperty.squareFeet.toLocaleString()} sq ft • 
                        {subjectProperty.yearBuilt ? `Built ${subjectProperty.yearBuilt}` : ''}
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Comp Criteria Tab */}
          <TabsContent value="criteria" className="mt-0">
            {subjectProperty ? (
              <div className="space-y-6">
                <div className="bg-[#0f1d31]/20 p-4 rounded-md border border-blue-200 mb-6">
                  <div className="flex items-start gap-4">
                    <Home className="h-5 w-5 text-[#FF7A00] mt-1" />
                    <div>
                      <h3 className="font-medium">Subject Property</h3>
                      <p className="text-sm text-muted-foreground">
                        {subjectProperty.address}, {subjectProperty.city}, {subjectProperty.state} {subjectProperty.zipCode}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-[#FF7A00]" />
                          {formatCurrency(subjectProperty.price)}
                        </div>
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1 text-[#FF7A00]" />
                          {subjectProperty.bedrooms} beds
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1 text-[#FF7A00]" />
                          {subjectProperty.bathrooms} baths
                        </div>
                        <div className="flex items-center">
                          <Grid2X2 className="h-4 w-4 mr-1 text-[#FF7A00]" />
                          {subjectProperty.squareFeet.toLocaleString()} sq ft
                        </div>
                        {subjectProperty.yearBuilt && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            Built {subjectProperty.yearBuilt}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Search Radius (miles)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        className="flex-1"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={[compCriteria.radius]}
                        onValueChange={(value) => setCompCriteria({ ...compCriteria, radius: value[0] })}
                      />
                      <span className="w-12 text-right">{compCriteria.radius}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Sale Timeframe</Label>
                    <Select
                      value={compCriteria.saleTimeframe?.toString()}
                      onValueChange={(value) => setCompCriteria({ ...compCriteria, saleTimeframe: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {saleTimeframeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Property Type</Label>
                    <Select
                      value={compCriteria.propertyType}
                      onValueChange={(value) => setCompCriteria({ ...compCriteria, propertyType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Listing Status</Label>
                    <Select
                      value={compCriteria.status}
                      onValueChange={(value) => setCompCriteria({ ...compCriteria, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Bedrooms Range</Label>
                      <span className="text-sm text-muted-foreground">
                        {compCriteria.minBeds} - {compCriteria.maxBeds}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={compCriteria.minBeds}
                          onChange={(e) => setCompCriteria({ 
                            ...compCriteria, 
                            minBeds: parseInt(e.target.value) 
                          })}
                        />
                      </div>
                      <span className="flex items-center">to</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={compCriteria.maxBeds}
                          onChange={(e) => setCompCriteria({ 
                            ...compCriteria, 
                            maxBeds: parseInt(e.target.value) 
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Bathrooms Range</Label>
                      <span className="text-sm text-muted-foreground">
                        {compCriteria.minBaths} - {compCriteria.maxBaths}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={compCriteria.minBaths}
                          onChange={(e) => setCompCriteria({ 
                            ...compCriteria, 
                            minBaths: parseFloat(e.target.value) 
                          })}
                        />
                      </div>
                      <span className="flex items-center">to</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={compCriteria.maxBaths}
                          onChange={(e) => setCompCriteria({ 
                            ...compCriteria, 
                            maxBaths: parseFloat(e.target.value) 
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Square Footage Range</Label>
                      <span className="text-sm text-muted-foreground">
                        {compCriteria.minSqft.toLocaleString()} - {compCriteria.maxSqft.toLocaleString()} sq ft
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={500}
                          max={10000}
                          step={100}
                          value={compCriteria.minSqft}
                          onChange={(e) => setCompCriteria({ 
                            ...compCriteria, 
                            minSqft: parseInt(e.target.value) 
                          })}
                        />
                      </div>
                      <span className="flex items-center">to</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={500}
                          max={10000}
                          step={100}
                          value={compCriteria.maxSqft}
                          onChange={(e) => setCompCriteria({ 
                            ...compCriteria, 
                            maxSqft: parseInt(e.target.value) 
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Price Range (% of subject property)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        className="flex-1"
                        min={5}
                        max={50}
                        step={5}
                        value={[compCriteria.priceRange]}
                        onValueChange={(value) => setCompCriteria({ ...compCriteria, priceRange: value[0] })}
                      />
                      <span className="w-12 text-right">±{compCriteria.priceRange}%</span>
                    </div>
                    {subjectProperty && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(subjectProperty.price * (1 - compCriteria.priceRange / 100))} to {formatCurrency(subjectProperty.price * (1 + compCriteria.priceRange / 100))}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('search')}
                    className="border-[#0f1d31] hover:bg-[#0f1d31] text-slate-300 gap-2"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleFindComps}
                    className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white gap-2"
                    disabled={findCompsMutation.isPending}
                  >
                    {findCompsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Finding comps...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Find Comps
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Subject Property Selected</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Please find and select a subject property first
                </p>
                <Button 
                  onClick={() => setActiveTab('search')} 
                  className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                >
                  Find a Property
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Comp Results Tab */}
          <TabsContent value="results" className="mt-0">
            {comps.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Comparable Properties</h3>
                  <span className="text-sm text-muted-foreground">
                    {comps.length} properties found • Select up to 5 for detailed comparison
                  </span>
                </div>
                
                {/* Subject property summary */}
                {subjectProperty && (
                  <div className="bg-[#0f1d31]/20 p-4 rounded-md border border-[#0f1d31]/30 mb-4">
                    <div className="flex items-start gap-4">
                      <Home className="h-5 w-5 text-[#FF7A00] mt-1" />
                      <div>
                        <h3 className="font-medium">Subject Property</h3>
                        <p className="text-sm text-muted-foreground">
                          {subjectProperty.address}, {subjectProperty.city}, {subjectProperty.state} {subjectProperty.zipCode}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {formatCurrency(subjectProperty.price)}
                          </div>
                          <div className="flex items-center">
                            <Bed className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {subjectProperty.bedrooms} beds
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {subjectProperty.bathrooms} baths
                          </div>
                          <div className="flex items-center">
                            <Grid2X2 className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {subjectProperty.squareFeet.toLocaleString()} sq ft
                          </div>
                          {subjectProperty.yearBuilt && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-[#FF7A00]" />
                              Built {subjectProperty.yearBuilt}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Comp results table */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Price/Sq.Ft</TableHead>
                        <TableHead>Beds</TableHead>
                        <TableHead>Baths</TableHead>
                        <TableHead>Sq.Ft</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Distance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comps.map((property) => (
                        <TableRow 
                          key={property.id} 
                          className={selectedComps.some(comp => comp.id === property.id) ? 'bg-[#0f1d31]/20' : ''}
                        >
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant={selectedComps.some(comp => comp.id === property.id) ? "default" : "outline"}
                              className={selectedComps.some(comp => comp.id === property.id) 
                                ? "w-8 h-8 p-0 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white border-[#FF7A00]" 
                                : "w-8 h-8 p-0 border-[#0f1d31] hover:bg-[#0f1d31] text-slate-300"}
                              onClick={() => handleSelectComp(property)}
                            >
                              {selectedComps.some(comp => comp.id === property.id) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <PencilRuler className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {property.address && property.address.length > 25 
                              ? `${property.address.substring(0, 25)}...` 
                              : property.address || ''}
                          </TableCell>
                          <TableCell>{formatCurrency(property.price)}</TableCell>
                          <TableCell>
                            {property.pricePerSqft
                              ? `$${property.pricePerSqft}`
                              : `$${calculatePricePerSqFt(property.price, property.squareFeet)}`
                            }
                          </TableCell>
                          <TableCell>{property.bedrooms}</TableCell>
                          <TableCell>{property.bathrooms}</TableCell>
                          <TableCell>{property.squareFeet.toLocaleString()}</TableCell>
                          <TableCell>{property.yearBuilt || 'N/A'}</TableCell>
                          <TableCell>
                            {/* This would be calculated based on geolocation in a real implementation */}
                            {Math.round(Math.random() * 20) / 10} mi
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between mt-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('criteria')}
                      className="border-[#0f1d31] hover:bg-[#0f1d31] text-slate-300 gap-2"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      Back to Criteria
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleFindComps}
                      className="border-[#0f1d31] hover:bg-[#0f1d31] text-slate-300 gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Refresh Results
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => setActiveTab('adjustments')}
                    className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white gap-2"
                    disabled={selectedComps.length === 0}
                  >
                    <Sliders className="h-4 w-4" />
                    Adjust Selected Comps ({selectedComps.length})
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Comparable Properties Found</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Please adjust your search criteria and try again
                </p>
                <Button 
                  onClick={() => setActiveTab('criteria')}
                  className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                >
                  Adjust Criteria
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Adjustments Tab */}
          <TabsContent value="adjustments" className="mt-0">
            {selectedComps.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Adjust Comparable Properties</h3>
                  <span className="text-sm text-muted-foreground">
                    {selectedComps.length} properties selected
                  </span>
                </div>
                
                {/* Subject property summary */}
                {subjectProperty && (
                  <div className="bg-[#0f1d31]/20 p-4 rounded-md border border-[#0f1d31]/30 mb-4">
                    <div className="flex items-start gap-4">
                      <Home className="h-5 w-5 text-[#FF7A00] mt-1" />
                      <div>
                        <h3 className="font-medium">Subject Property</h3>
                        <p className="text-sm text-muted-foreground">
                          {subjectProperty.address}, {subjectProperty.city}, {subjectProperty.state} {subjectProperty.zipCode}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {formatCurrency(subjectProperty.price)}
                          </div>
                          <div className="flex items-center">
                            <Bed className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {subjectProperty.bedrooms} beds
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {subjectProperty.bathrooms} baths
                          </div>
                          <div className="flex items-center">
                            <Grid2X2 className="h-4 w-4 mr-1 text-[#FF7A00]" />
                            {subjectProperty.squareFeet.toLocaleString()} sq ft
                          </div>
                          {subjectProperty.yearBuilt && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-[#FF7A00]" />
                              Built {subjectProperty.yearBuilt}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-medium text-muted-foreground w-[200px]">Feature</th>
                        <th className="p-2 text-center font-medium text-[#FF7A00] w-[150px]">
                          {subjectProperty ? 'Subject' : 'Subject'}
                        </th>
                        {selectedComps.map((comp) => (
                          <th key={comp.id} className="p-2 text-center font-medium text-muted-foreground w-[150px]">
                            Comp #{selectedComps.findIndex(c => c.id === comp.id) + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Address row */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">Address</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          {subjectProperty?.address && subjectProperty.address.length > 20 
                            ? `${subjectProperty.address.substring(0, 20)}...` 
                            : subjectProperty?.address || ''}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            {comp.address && comp.address.length > 20 
                              ? `${comp.address.substring(0, 20)}...` 
                              : comp.address || ''}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Price row */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">
                          <div className="flex items-center">
                            <span>Price</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground/50" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Sale price or current listing price</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                        <td className="p-2 text-center font-medium bg-[#0f1d31]/20">
                          {formatCurrency(subjectProperty?.price || 0)}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            {formatCurrency(comp.price)}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Beds row + adjustment */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">Bedrooms</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          {subjectProperty?.bedrooms}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <div className="flex flex-col items-center">
                              <span>{comp.bedrooms}</span>
                              {subjectProperty && subjectProperty.bedrooms !== comp.bedrooms && (
                                <div className="mt-1">
                                  <Input
                                    type="number"
                                    placeholder="$ Adj"
                                    className="w-20 h-7 text-xs"
                                    value={compAdjustments[comp.id]?.adjustments?.bedrooms || ''}
                                    onChange={(e) => handleAdjustmentChange(
                                      comp.id, 
                                      'bedrooms', 
                                      e.target.value === '' ? 0 : parseInt(e.target.value)
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Baths row + adjustment */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">Bathrooms</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          {subjectProperty?.bathrooms}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <div className="flex flex-col items-center">
                              <span>{comp.bathrooms}</span>
                              {subjectProperty && subjectProperty.bathrooms !== comp.bathrooms && (
                                <div className="mt-1">
                                  <Input
                                    type="number"
                                    placeholder="$ Adj"
                                    className="w-20 h-7 text-xs"
                                    value={compAdjustments[comp.id]?.adjustments?.bathrooms || ''}
                                    onChange={(e) => handleAdjustmentChange(
                                      comp.id, 
                                      'bathrooms', 
                                      e.target.value === '' ? 0 : parseInt(e.target.value)
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Sqft row + adjustment */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">Square Feet</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          {subjectProperty?.squareFeet.toLocaleString()}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <div className="flex flex-col items-center">
                              <span>{comp.squareFeet.toLocaleString()}</span>
                              {subjectProperty && subjectProperty.squareFeet !== comp.squareFeet && (
                                <div className="mt-1">
                                  <Input
                                    type="number"
                                    placeholder="$ Adj"
                                    className="w-20 h-7 text-xs"
                                    value={compAdjustments[comp.id]?.adjustments?.squareFeet || ''}
                                    onChange={(e) => handleAdjustmentChange(
                                      comp.id, 
                                      'squareFeet', 
                                      e.target.value === '' ? 0 : parseInt(e.target.value)
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Year built row + adjustment */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">Year Built</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          {subjectProperty?.yearBuilt || 'N/A'}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <div className="flex flex-col items-center">
                              <span>{comp.yearBuilt || 'N/A'}</span>
                              {subjectProperty && subjectProperty.yearBuilt && comp.yearBuilt && 
                               subjectProperty.yearBuilt !== comp.yearBuilt && (
                                <div className="mt-1">
                                  <Input
                                    type="number"
                                    placeholder="$ Adj"
                                    className="w-20 h-7 text-xs"
                                    value={compAdjustments[comp.id]?.adjustments?.age || ''}
                                    onChange={(e) => handleAdjustmentChange(
                                      comp.id, 
                                      'age', 
                                      e.target.value === '' ? 0 : parseInt(e.target.value)
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Garage row + adjustment */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">Garage Spaces</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          {subjectProperty?.garageSpaces || 'N/A'}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <div className="flex flex-col items-center">
                              <span>{comp.garageSpaces || 'N/A'}</span>
                              {subjectProperty && subjectProperty.garageSpaces && comp.garageSpaces !== undefined && 
                               subjectProperty.garageSpaces !== comp.garageSpaces && (
                                <div className="mt-1">
                                  <Input
                                    type="number"
                                    placeholder="$ Adj"
                                    className="w-20 h-7 text-xs"
                                    value={compAdjustments[comp.id]?.adjustments?.garage || ''}
                                    onChange={(e) => handleAdjustmentChange(
                                      comp.id, 
                                      'garage', 
                                      e.target.value === '' ? 0 : parseInt(e.target.value)
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Location adjustment row */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">
                          <div className="flex items-center">
                            <span>Location Adjustment</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground/50" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adjustment for location quality differences</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">Base</td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <Input
                              type="number"
                              placeholder="$ Adj"
                              className="w-20 h-7 text-xs mx-auto"
                              value={compAdjustments[comp.id]?.adjustments?.location || ''}
                              onChange={(e) => handleAdjustmentChange(
                                comp.id, 
                                'location', 
                                e.target.value === '' ? 0 : parseInt(e.target.value)
                              )}
                            />
                          </td>
                        ))}
                      </tr>
                      
                      {/* Condition adjustment row */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">
                          <div className="flex items-center">
                            <span>Condition Adjustment</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground/50" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adjustment for property condition differences</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">Base</td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <Input
                              type="number"
                              placeholder="$ Adj"
                              className="w-20 h-7 text-xs mx-auto"
                              value={compAdjustments[comp.id]?.adjustments?.condition || ''}
                              onChange={(e) => handleAdjustmentChange(
                                comp.id, 
                                'condition', 
                                e.target.value === '' ? 0 : parseInt(e.target.value)
                              )}
                            />
                          </td>
                        ))}
                      </tr>
                      
                      {/* Other adjustment row */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">
                          <div className="flex items-center">
                            <span>Other Adjustments</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground/50" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Additional adjustments not covered above</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">Base</td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            <Input
                              type="number"
                              placeholder="$ Adj"
                              className="w-20 h-7 text-xs mx-auto"
                              value={compAdjustments[comp.id]?.adjustments?.other || ''}
                              onChange={(e) => handleAdjustmentChange(
                                comp.id, 
                                'other', 
                                e.target.value === '' ? 0 : parseInt(e.target.value)
                              )}
                            />
                          </td>
                        ))}
                      </tr>
                      
                      {/* Total adjustments row */}
                      <tr className="border-b bg-muted/20">
                        <td className="p-2 font-medium">Total Adjustments</td>
                        <td className="p-2 text-center font-medium bg-[#0f1d31]/20">-</td>
                        {selectedComps.map((comp) => {
                          const adjustmentDiff = calculateAdjustmentDifference(comp.id);
                          return (
                            <td key={comp.id} className="p-2 text-center font-medium">
                              <span className={
                                adjustmentDiff > 0 
                                  ? 'text-green-600' 
                                  : adjustmentDiff < 0 
                                    ? 'text-red-600' 
                                    : ''
                              }>
                                {adjustmentDiff > 0 ? '+' : ''}
                                {formatCurrency(adjustmentDiff)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      
                      {/* Adjusted price row */}
                      <tr className="border-b font-bold">
                        <td className="p-2">Adjusted Price</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          {formatCurrency(subjectProperty?.price || 0)}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            {formatCurrency(compAdjustments[comp.id]?.adjustedPrice || comp.price)}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Price per sqft row */}
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground">Price per Sq.Ft</td>
                        <td className="p-2 text-center bg-[#0f1d31]/20">
                          ${calculatePricePerSqFt(subjectProperty?.price || 0, subjectProperty?.squareFeet || 1)}
                        </td>
                        {selectedComps.map((comp) => (
                          <td key={comp.id} className="p-2 text-center">
                            ${calculatePricePerSqFt(
                              compAdjustments[comp.id]?.adjustedPrice || comp.price, 
                              comp.squareFeet
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('results')}
                    className="border-[#0f1d31] hover:bg-[#0f1d31] text-slate-300 gap-2"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Back to Results
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // This would open a PDF or print view in a real implementation
                        toast({
                          title: 'Export Feature',
                          description: 'CMA Report export will be available in the next update',
                        });
                      }}
                      className="gap-2"
                    >
                      <FileOutput className="h-4 w-4" />
                      Export CMA Report
                    </Button>
                    
                    <Button 
                      onClick={handleSaveAdjustments}
                      className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white gap-2"
                      disabled={saveAdjustmentsMutation.isPending}
                    >
                      {saveAdjustmentsMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Adjustments
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Summary card */}
                <Card className="mt-8 bg-[#071224]/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Comparable Market Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Comps Price Range</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(Math.min(...selectedComps.map(c => c.price)))} - {formatCurrency(Math.max(...selectedComps.map(c => c.price)))}
                        </p>
                        <p className="text-xs text-muted-foreground">Based on {selectedComps.length} comparable properties</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Adjusted Price Range</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(Math.min(...selectedComps.map(c => compAdjustments[c.id]?.adjustedPrice || c.price)))} - {formatCurrency(Math.max(...selectedComps.map(c => compAdjustments[c.id]?.adjustedPrice || c.price)))}
                        </p>
                        <p className="text-xs text-muted-foreground">After applying all adjustments</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Estimated Market Value</p>
                        <p className="text-2xl font-bold text-[#FF7A00]">
                          {formatCurrency(Math.round(selectedComps.reduce((sum, comp) => sum + (compAdjustments[comp.id]?.adjustedPrice || comp.price), 0) / selectedComps.length / 1000) * 1000)}
                        </p>
                        <p className="text-xs text-muted-foreground">Average of adjusted comp prices</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Properties Selected for Comparison</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Please select comparable properties to make adjustments
                </p>
                <Button onClick={() => setActiveTab('results')}>
                  Select Comps
                </Button>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="border-t px-6 py-4 flex justify-between">
        <div className="flex items-center text-xs text-muted-foreground">
          <Info className="h-4 w-4 mr-2 text-[#FF7A00]" />
          <span>
            Adjustments are made to comparable properties to account for differences from the subject property.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}