import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  DollarSign, 
  CalendarRange, 
  Save,
  Building2,
  Ruler,
  Filter,
  X,
  Map as MapIcon,
  ListFilter,
  LayoutGrid,
  CheckCircle2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Property type definition from the API
interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  propertyType: string;
  status: string;
  yearBuilt: number;
  createdAt: string;
  updatedAt: string;
  neighborhood: string | null;
  latitude: string | null;
  longitude: string | null;
  images?: string[] | null;
  description?: string | null;
  features?: string[] | null;
}

// Search filters interface
interface SearchFilters {
  location: string;
  propertyType: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  minSqft: string;
  maxSqft: string;
  yearBuilt: string;
  hasBasement: boolean;
  hasGarage: boolean;
}

// Saved search interface
interface SavedSearch {
  id: number;
  userId: number;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Search state
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    propertyType: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    minBaths: "",
    minSqft: "",
    maxSqft: "",
    yearBuilt: "",
    hasBasement: false,
    hasGarage: false
  });
  
  // View mode state (list, grid, map)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(12);
  
  // Save search state
  const [saveSearchName, setSaveSearchName] = useState("");
  
  // Parse URL params on initial load
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    // Update filters from URL parameters
    const newFilters = { ...filters };
    
    if (params.has('location')) newFilters.location = params.get('location') || "";
    if (params.has('propertyType')) newFilters.propertyType = params.get('propertyType') || "";
    if (params.has('status')) newFilters.status = params.get('status') || "";
    if (params.has('minPrice')) newFilters.minPrice = params.get('minPrice') || "";
    if (params.has('maxPrice')) newFilters.maxPrice = params.get('maxPrice') || "";
    if (params.has('minBeds')) newFilters.minBeds = params.get('minBeds') || "";
    if (params.has('minBaths')) newFilters.minBaths = params.get('minBaths') || "";
    if (params.has('minSqft')) newFilters.minSqft = params.get('minSqft') || "";
    if (params.has('maxSqft')) newFilters.maxSqft = params.get('maxSqft') || "";
    if (params.has('yearBuilt')) newFilters.yearBuilt = params.get('yearBuilt') || "";
    if (params.has('hasBasement')) newFilters.hasBasement = params.get('hasBasement') === 'true';
    if (params.has('hasGarage')) newFilters.hasGarage = params.get('hasGarage') === 'true';
    
    if (params.has('page')) setPage(parseInt(params.get('page') || "1"));
    if (params.has('view')) setViewMode(params.get('view') as any || "grid");
    
    setFilters(newFilters);
  }, []);
  
  // Update URL when filters change
  const updateUrlWithFilters = () => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    // Clear existing parameters
    params.forEach((value, key) => {
      params.delete(key);
    });
    
    // Add current filters
    if (filters.location) params.set('location', filters.location);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.status) params.set('status', filters.status);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minBeds) params.set('minBeds', filters.minBeds);
    if (filters.minBaths) params.set('minBaths', filters.minBaths);
    if (filters.minSqft) params.set('minSqft', filters.minSqft);
    if (filters.maxSqft) params.set('maxSqft', filters.maxSqft);
    if (filters.yearBuilt) params.set('yearBuilt', filters.yearBuilt);
    if (filters.hasBasement) params.set('hasBasement', filters.hasBasement.toString());
    if (filters.hasGarage) params.set('hasGarage', filters.hasGarage.toString());
    
    params.set('page', page.toString());
    params.set('view', viewMode);
    
    // Update URL without reloading page
    window.history.replaceState({}, '', `${url.pathname}?${params.toString()}`);
  };
  
  // Build query params for API request
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.location) params.append("location", filters.location);
    if (filters.propertyType) params.append("propertyType", filters.propertyType);
    if (filters.status) params.append("status", filters.status);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.minBeds) params.append("minBeds", filters.minBeds);
    if (filters.minBaths) params.append("minBaths", filters.minBaths);
    if (filters.minSqft) params.append("minSqft", filters.minSqft);
    if (filters.maxSqft) params.append("maxSqft", filters.maxSqft);
    if (filters.yearBuilt) params.append("yearBuilt", filters.yearBuilt);
    if (filters.hasBasement) params.append("hasBasement", "true");
    if (filters.hasGarage) params.append("hasGarage", "true");
    
    return params.toString();
  };
  
  // Fetch properties with filters
  const { data: properties, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/properties', filters, page],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      let url = `/api/properties`;
      if (queryParams) url += `?${queryParams}`;
      
      const response = await apiRequest('GET', url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      return response.json();
    }
  });
  
  // Fetch saved searches
  const { data: savedSearches, isLoading: isSavedSearchesLoading } = useQuery({
    queryKey: ['/api/saved-searches'],
    queryFn: async () => {
      if (!user) return [];
      
      const response = await apiRequest('GET', `/api/users/${user.id}/saved-searches`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved searches');
      }
      
      return response.json();
    },
    enabled: !!user
  });
  
  // Save search mutation
  const saveSearchMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('You must be logged in to save searches');
      
      const data = {
        userId: user.id,
        name,
        filters: { ...filters }
      };
      
      const response = await apiRequest('POST', '/api/saved-searches', data);
      
      if (!response.ok) {
        throw new Error('Failed to save search');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Search saved",
        description: "Your search has been saved successfully.",
      });
      
      // Reset the save search name
      setSaveSearchName("");
      
      // Refetch saved searches
      queryClient.invalidateQueries({ queryKey: ['/api/saved-searches'] });
    },
    onError: (error) => {
      toast({
        title: "Error saving search",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete saved search mutation
  const deleteSearchMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/saved-searches/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete saved search');
      }
      
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: "Search deleted",
        description: "Your saved search has been deleted.",
      });
      
      // Refetch saved searches
      queryClient.invalidateQueries({ queryKey: ['/api/saved-searches'] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting search",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };
  
  // Handle search submission
  const handleSearch = () => {
    setPage(1);
    updateUrlWithFilters();
    refetch();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      location: "",
      propertyType: "",
      status: "",
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      minBaths: "",
      minSqft: "",
      maxSqft: "",
      yearBuilt: "",
      hasBasement: false,
      hasGarage: false
    });
    setPage(1);
  };
  
  // Load saved search
  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    setPage(1);
    handleSearch();
  };
  
  // Save current search
  const saveSearch = () => {
    if (saveSearchName.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter a name for your search",
        variant: "destructive",
      });
      return;
    }
    
    saveSearchMutation.mutate(saveSearchName);
  };
  
  // Format price to display as currency
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(numPrice);
  };
  
  // Get status color based on property status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Pagination logic
  const totalItems = properties?.length || 0;
  const totalPages = Math.ceil(totalItems / resultsPerPage);
  const paginatedProperties = properties
    ? properties.slice((page - 1) * resultsPerPage, page * resultsPerPage)
    : [];
  
  // Update URL when filters change
  useEffect(() => {
    updateUrlWithFilters();
  }, [filters, page, viewMode]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" asChild>
              <Link href="/" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Property Search</h1>
            <p className="text-muted-foreground">Find properties that match your criteria</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar with filters */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Filters</CardTitle>
                <CardDescription>Refine your property search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City, State, or ZIP"
                      className="pl-8"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) => handleFilterChange('propertyType', value)}
                  >
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="All Property Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Property Types</SelectItem>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                      <SelectItem value="Multi Family">Multi Family</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Any Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.minPrice}
                      onValueChange={(value) => handleFilterChange('minPrice', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Min Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_min">No Min</SelectItem>
                        <SelectItem value="50000">$50K</SelectItem>
                        <SelectItem value="100000">$100K</SelectItem>
                        <SelectItem value="200000">$200K</SelectItem>
                        <SelectItem value="300000">$300K</SelectItem>
                        <SelectItem value="500000">$500K</SelectItem>
                        <SelectItem value="750000">$750K</SelectItem>
                        <SelectItem value="1000000">$1M</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.maxPrice}
                      onValueChange={(value) => handleFilterChange('maxPrice', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Max Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_max">No Max</SelectItem>
                        <SelectItem value="200000">$200K</SelectItem>
                        <SelectItem value="300000">$300K</SelectItem>
                        <SelectItem value="500000">$500K</SelectItem>
                        <SelectItem value="750000">$750K</SelectItem>
                        <SelectItem value="1000000">$1M</SelectItem>
                        <SelectItem value="1500000">$1.5M</SelectItem>
                        <SelectItem value="2000000">$2M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Beds & Baths</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.minBeds}
                      onValueChange={(value) => handleFilterChange('minBeds', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Beds" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.minBaths}
                      onValueChange={(value) => handleFilterChange('minBaths', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Baths" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="1.5">1.5+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Square Feet</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.minSqft}
                      onValueChange={(value) => handleFilterChange('minSqft', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Min Sq.Ft." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_min">No Min</SelectItem>
                        <SelectItem value="500">500+</SelectItem>
                        <SelectItem value="1000">1,000+</SelectItem>
                        <SelectItem value="1500">1,500+</SelectItem>
                        <SelectItem value="2000">2,000+</SelectItem>
                        <SelectItem value="2500">2,500+</SelectItem>
                        <SelectItem value="3000">3,000+</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.maxSqft}
                      onValueChange={(value) => handleFilterChange('maxSqft', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Max Sq.Ft." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_max">No Max</SelectItem>
                        <SelectItem value="1500">1,500</SelectItem>
                        <SelectItem value="2000">2,000</SelectItem>
                        <SelectItem value="2500">2,500</SelectItem>
                        <SelectItem value="3000">3,000</SelectItem>
                        <SelectItem value="4000">4,000</SelectItem>
                        <SelectItem value="5000">5,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Select
                    value={filters.yearBuilt}
                    onValueChange={(value) => handleFilterChange('yearBuilt', value)}
                  >
                    <SelectTrigger id="yearBuilt">
                      <SelectValue placeholder="Any Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_year">Any Year</SelectItem>
                      <SelectItem value="2020">2020 or newer</SelectItem>
                      <SelectItem value="2010">2010 or newer</SelectItem>
                      <SelectItem value="2000">2000 or newer</SelectItem>
                      <SelectItem value="1990">1990 or newer</SelectItem>
                      <SelectItem value="1980">1980 or newer</SelectItem>
                      <SelectItem value="1950">1950 or newer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label>Features</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasBasement" 
                      checked={filters.hasBasement}
                      onCheckedChange={(checked) => handleFilterChange('hasBasement', Boolean(checked))}
                    />
                    <Label htmlFor="hasBasement" className="cursor-pointer">Has Basement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasGarage" 
                      checked={filters.hasGarage}
                      onCheckedChange={(checked) => handleFilterChange('hasGarage', Boolean(checked))}
                    />
                    <Label htmlFor="hasGarage" className="cursor-pointer">Has Garage</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full" onClick={handleSearch}>
                  Search Properties
                </Button>
                <Button variant="outline" className="w-full" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </CardFooter>
            </Card>
            
            {user && (
              <Card className="bg-[#050e1d] border-[#0f1d31] text-white">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Saved Searches</CardTitle>
                  <CardDescription className="text-slate-400">Save and retrieve your searches</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="saveSearchName" className="text-white">Save Current Search</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="saveSearchName"
                        placeholder="Search Name"
                        value={saveSearchName}
                        onChange={(e) => setSaveSearchName(e.target.value)}
                        className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-0 focus:ring-offset-0"
                      />
                      <Button 
                        size="icon" 
                        onClick={saveSearch}
                        disabled={saveSearchMutation.isPending}
                        className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="bg-[#0f1d31]" />
                  
                  <div className="space-y-2">
                    <Label className="text-white">Your Saved Searches</Label>
                    {isSavedSearchesLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full bg-[#071224]" />
                        <Skeleton className="h-10 w-full bg-[#071224]" />
                      </div>
                    ) : savedSearches && savedSearches.length > 0 ? (
                      <div className="space-y-2">
                        {savedSearches.map((search: SavedSearch) => (
                          <div key={search.id} className="flex items-center justify-between bg-[#071224] border border-[#0f1d31] rounded-md">
                            <Button 
                              variant="ghost" 
                              className="justify-start p-2 h-auto w-full text-white hover:text-[#FF7A00] hover:bg-[#071224]"
                              onClick={() => loadSavedSearch(search)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2 text-[#FF7A00]" />
                              <span className="truncate">{search.name}</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-red-900/20"
                              onClick={() => deleteSearchMutation.mutate(search.id)}
                              disabled={deleteSearchMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        You don't have any saved searches yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right content area with property listings */}
          <div className="md:col-span-3 space-y-6">
            {/* Results header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-7 w-32" />
                  ) : (
                    `${totalItems} ${totalItems === 1 ? 'Property' : 'Properties'} Found`
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filters.location ? `Location: ${filters.location}` : 'All Locations'}
                  {filters.propertyType ? ` • Type: ${filters.propertyType}` : ''}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select
                  value={resultsPerPage.toString()}
                  onValueChange={(value) => setResultsPerPage(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Show" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 per page</SelectItem>
                    <SelectItem value="12">12 per page</SelectItem>
                    <SelectItem value="24">24 per page</SelectItem>
                    <SelectItem value="48">48 per page</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="border rounded-md p-1 flex">
                  <Button 
                    variant={viewMode === "grid" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewMode("list")}
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "map" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewMode("map")}
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load properties</h3>
                <p className="text-red-600">
                  {error instanceof Error ? error.message : 'An unknown error occurred'}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </div>
            )}
            
            {/* Loading state */}
            {isLoading && (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <Skeleton className="h-48 w-full sm:w-48" />
                        <div className="p-6 flex-1">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
            
            {/* No results state */}
            {!isLoading && (!paginatedProperties || paginatedProperties.length === 0) && !error && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No properties found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any properties matching your search criteria. Try adjusting your filters or search for a different location.
                </p>
                <Button onClick={resetFilters}>Clear All Filters</Button>
              </div>
            )}
            
            {/* Grid view */}
            {!isLoading && paginatedProperties && paginatedProperties.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProperties.map((property: Property) => (
                  <Card key={property.id} className="overflow-hidden">
                    <div className="relative h-48 bg-muted">
                      <div className="absolute top-2 right-2">
                        <Badge className={getStatusColor(property.status)}>
                          {property.status}
                        </Badge>
                      </div>
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={Array.isArray(property.images) ? property.images[0] : ''}
                          alt={property.address}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Home className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{property.address}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {property.city}, {property.state} {property.zipCode}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between mb-4">
                        <span className="text-xl font-bold">{formatPrice(property.price)}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Bed className="h-3.5 w-3.5" />
                            <span>Beds</span>
                          </div>
                          <span className="font-medium">{property.bedrooms}</span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Bath className="h-3.5 w-3.5" />
                            <span>Baths</span>
                          </div>
                          <span className="font-medium">{property.bathrooms}</span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Ruler className="h-3.5 w-3.5" />
                            <span>Sq Ft</span>
                          </div>
                          <span className="font-medium">
                            {parseInt(property.squareFeet).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-border pt-4">
                      <Button className="w-full" asChild>
                        <Link href={`/properties/${property.id}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            
            {/* List view */}
            {!isLoading && paginatedProperties && paginatedProperties.length > 0 && viewMode === "list" && (
              <div className="space-y-4">
                {paginatedProperties.map((property: Property) => (
                  <Card key={property.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-48 h-48 bg-muted">
                        <div className="absolute top-2 right-2">
                          <Badge className={getStatusColor(property.status)}>
                            {property.status}
                          </Badge>
                        </div>
                        {property.images && property.images.length > 0 ? (
                          <img 
                            src={Array.isArray(property.images) ? property.images[0] : ''}
                            alt={property.address}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Home className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{property.address}</h3>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {property.city}, {property.state} {property.zipCode}
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0 text-xl font-bold">
                            {formatPrice(property.price)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 my-4">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            <span>{property.bedrooms} Beds</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4 text-muted-foreground" />
                            <span>{property.bathrooms} Baths</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                            <span>{parseInt(property.squareFeet).toLocaleString()} sq ft</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>{property.propertyType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarRange className="h-4 w-4 text-muted-foreground" />
                            <span>Built {property.yearBuilt}</span>
                          </div>
                        </div>
                        
                        {property.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {property.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-end">
                          <Button asChild>
                            <Link href={`/properties/${property.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Map view (placeholder) */}
            {!isLoading && viewMode === "map" && (
              <Card>
                <CardContent className="p-6 text-center">
                  <MapIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Map View Coming Soon</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We're working on an interactive map view to help you visualize property locations. Please check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Pagination */}
            {!isLoading && paginatedProperties && paginatedProperties.length > 0 && totalPages > 1 && (
              <div className="flex justify-center my-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          pageNum === 1 || 
                          pageNum === totalPages || 
                          Math.abs(pageNum - page) <= 1
                        );
                      })
                      .map((pageNum, i, arr) => {
                        // Add ellipsis if there are gaps
                        const prevPage = arr[i - 1];
                        const needsEllipsisBefore = prevPage && pageNum - prevPage > 1;
                        
                        return (
                          <div key={pageNum} className="flex">
                            {needsEllipsisBefore && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                isActive={page === pageNum}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(pageNum);
                                }}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          </div>
                        );
                      })}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}