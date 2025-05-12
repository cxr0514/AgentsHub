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
        return 'bg-green-900 text-green-100 border-green-800';
      case 'pending':
        return 'bg-amber-900 text-amber-100 border-amber-800';
      case 'sold':
        return 'bg-blue-900 text-blue-100 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
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
            <Button variant="ghost" size="sm" className="mb-2 text-slate-400 hover:text-[#FF7A00] hover:bg-[#071224]" asChild>
              <Link href="/" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-white">Property Search</h1>
            <p className="text-slate-400">Find properties that match your criteria</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar with filters */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-[#050e1d] border-[#0f1d31] text-white">
              <CardHeader>
                <CardTitle className="text-lg text-white">Search Filters</CardTitle>
                <CardDescription className="text-slate-400">Refine your property search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-[#FF7A00]" />
                    <Input
                      id="location"
                      placeholder="City, State, or ZIP"
                      className="pl-8 bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-0 focus:ring-offset-0"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="propertyType" className="text-white">Property Type</Label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) => handleFilterChange('propertyType', value)}
                  >
                    <SelectTrigger id="propertyType" className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                      <SelectValue placeholder="All Property Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                      <SelectItem value="all" className="focus:bg-[#0f1d31] focus:text-white">All Property Types</SelectItem>
                      <SelectItem value="Single Family" className="focus:bg-[#0f1d31] focus:text-white">Single Family</SelectItem>
                      <SelectItem value="Condo" className="focus:bg-[#0f1d31] focus:text-white">Condo</SelectItem>
                      <SelectItem value="Townhouse" className="focus:bg-[#0f1d31] focus:text-white">Townhouse</SelectItem>
                      <SelectItem value="Multi Family" className="focus:bg-[#0f1d31] focus:text-white">Multi Family</SelectItem>
                      <SelectItem value="Land" className="focus:bg-[#0f1d31] focus:text-white">Land</SelectItem>
                      <SelectItem value="Commercial" className="focus:bg-[#0f1d31] focus:text-white">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger id="status" className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                      <SelectValue placeholder="Any Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                      <SelectItem value="any" className="focus:bg-[#0f1d31] focus:text-white">Any Status</SelectItem>
                      <SelectItem value="Active" className="focus:bg-[#0f1d31] focus:text-white">Active</SelectItem>
                      <SelectItem value="Pending" className="focus:bg-[#0f1d31] focus:text-white">Pending</SelectItem>
                      <SelectItem value="Sold" className="focus:bg-[#0f1d31] focus:text-white">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="bg-[#0f1d31]" />
                
                <div className="space-y-2">
                  <Label className="text-white">Price Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.minPrice}
                      onValueChange={(value) => handleFilterChange('minPrice', value)}
                    >
                      <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                        <SelectValue placeholder="Min Price" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                        <SelectItem value="no_min" className="focus:bg-[#0f1d31] focus:text-white">No Min</SelectItem>
                        <SelectItem value="50000" className="focus:bg-[#0f1d31] focus:text-white">$50K</SelectItem>
                        <SelectItem value="100000" className="focus:bg-[#0f1d31] focus:text-white">$100K</SelectItem>
                        <SelectItem value="200000" className="focus:bg-[#0f1d31] focus:text-white">$200K</SelectItem>
                        <SelectItem value="300000" className="focus:bg-[#0f1d31] focus:text-white">$300K</SelectItem>
                        <SelectItem value="500000" className="focus:bg-[#0f1d31] focus:text-white">$500K</SelectItem>
                        <SelectItem value="750000" className="focus:bg-[#0f1d31] focus:text-white">$750K</SelectItem>
                        <SelectItem value="1000000" className="focus:bg-[#0f1d31] focus:text-white">$1M</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.maxPrice}
                      onValueChange={(value) => handleFilterChange('maxPrice', value)}
                    >
                      <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                        <SelectValue placeholder="Max Price" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                        <SelectItem value="no_max" className="focus:bg-[#0f1d31] focus:text-white">No Max</SelectItem>
                        <SelectItem value="200000" className="focus:bg-[#0f1d31] focus:text-white">$200K</SelectItem>
                        <SelectItem value="300000" className="focus:bg-[#0f1d31] focus:text-white">$300K</SelectItem>
                        <SelectItem value="500000" className="focus:bg-[#0f1d31] focus:text-white">$500K</SelectItem>
                        <SelectItem value="750000" className="focus:bg-[#0f1d31] focus:text-white">$750K</SelectItem>
                        <SelectItem value="1000000" className="focus:bg-[#0f1d31] focus:text-white">$1M</SelectItem>
                        <SelectItem value="1500000" className="focus:bg-[#0f1d31] focus:text-white">$1.5M</SelectItem>
                        <SelectItem value="2000000" className="focus:bg-[#0f1d31] focus:text-white">$2M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Beds & Baths</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.minBeds}
                      onValueChange={(value) => handleFilterChange('minBeds', value)}
                    >
                      <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                        <SelectValue placeholder="Beds" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                        <SelectItem value="any" className="focus:bg-[#0f1d31] focus:text-white">Any</SelectItem>
                        <SelectItem value="1" className="focus:bg-[#0f1d31] focus:text-white">1+</SelectItem>
                        <SelectItem value="2" className="focus:bg-[#0f1d31] focus:text-white">2+</SelectItem>
                        <SelectItem value="3" className="focus:bg-[#0f1d31] focus:text-white">3+</SelectItem>
                        <SelectItem value="4" className="focus:bg-[#0f1d31] focus:text-white">4+</SelectItem>
                        <SelectItem value="5" className="focus:bg-[#0f1d31] focus:text-white">5+</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.minBaths}
                      onValueChange={(value) => handleFilterChange('minBaths', value)}
                    >
                      <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                        <SelectValue placeholder="Baths" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                        <SelectItem value="any" className="focus:bg-[#0f1d31] focus:text-white">Any</SelectItem>
                        <SelectItem value="1" className="focus:bg-[#0f1d31] focus:text-white">1+</SelectItem>
                        <SelectItem value="1.5" className="focus:bg-[#0f1d31] focus:text-white">1.5+</SelectItem>
                        <SelectItem value="2" className="focus:bg-[#0f1d31] focus:text-white">2+</SelectItem>
                        <SelectItem value="3" className="focus:bg-[#0f1d31] focus:text-white">3+</SelectItem>
                        <SelectItem value="4" className="focus:bg-[#0f1d31] focus:text-white">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Square Feet</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.minSqft}
                      onValueChange={(value) => handleFilterChange('minSqft', value)}
                    >
                      <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                        <SelectValue placeholder="Min Sq.Ft." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                        <SelectItem value="no_min" className="focus:bg-[#0f1d31] focus:text-white">No Min</SelectItem>
                        <SelectItem value="500" className="focus:bg-[#0f1d31] focus:text-white">500+</SelectItem>
                        <SelectItem value="1000" className="focus:bg-[#0f1d31] focus:text-white">1,000+</SelectItem>
                        <SelectItem value="1500" className="focus:bg-[#0f1d31] focus:text-white">1,500+</SelectItem>
                        <SelectItem value="2000" className="focus:bg-[#0f1d31] focus:text-white">2,000+</SelectItem>
                        <SelectItem value="2500" className="focus:bg-[#0f1d31] focus:text-white">2,500+</SelectItem>
                        <SelectItem value="3000" className="focus:bg-[#0f1d31] focus:text-white">3,000+</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.maxSqft}
                      onValueChange={(value) => handleFilterChange('maxSqft', value)}
                    >
                      <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                        <SelectValue placeholder="Max Sq.Ft." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                        <SelectItem value="no_max" className="focus:bg-[#0f1d31] focus:text-white">No Max</SelectItem>
                        <SelectItem value="1500" className="focus:bg-[#0f1d31] focus:text-white">1,500</SelectItem>
                        <SelectItem value="2000" className="focus:bg-[#0f1d31] focus:text-white">2,000</SelectItem>
                        <SelectItem value="2500" className="focus:bg-[#0f1d31] focus:text-white">2,500</SelectItem>
                        <SelectItem value="3000" className="focus:bg-[#0f1d31] focus:text-white">3,000</SelectItem>
                        <SelectItem value="4000" className="focus:bg-[#0f1d31] focus:text-white">4,000</SelectItem>
                        <SelectItem value="5000" className="focus:bg-[#0f1d31] focus:text-white">5,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt" className="text-white">Year Built</Label>
                  <Select
                    value={filters.yearBuilt}
                    onValueChange={(value) => handleFilterChange('yearBuilt', value)}
                  >
                    <SelectTrigger id="yearBuilt" className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                      <SelectValue placeholder="Any Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                      <SelectItem value="any_year" className="focus:bg-[#0f1d31] focus:text-white">Any Year</SelectItem>
                      <SelectItem value="2020" className="focus:bg-[#0f1d31] focus:text-white">2020 or newer</SelectItem>
                      <SelectItem value="2010" className="focus:bg-[#0f1d31] focus:text-white">2010 or newer</SelectItem>
                      <SelectItem value="2000" className="focus:bg-[#0f1d31] focus:text-white">2000 or newer</SelectItem>
                      <SelectItem value="1990" className="focus:bg-[#0f1d31] focus:text-white">1990 or newer</SelectItem>
                      <SelectItem value="1980" className="focus:bg-[#0f1d31] focus:text-white">1980 or newer</SelectItem>
                      <SelectItem value="1950" className="focus:bg-[#0f1d31] focus:text-white">1950 or newer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="bg-[#0f1d31]" />
                
                <div className="space-y-4">
                  <Label className="text-white">Features</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasBasement" 
                      checked={filters.hasBasement}
                      onCheckedChange={(checked) => handleFilterChange('hasBasement', Boolean(checked))}
                      className="border-[#0f1d31] data-[state=checked]:bg-[#FF7A00] data-[state=checked]:border-[#FF7A00]"
                    />
                    <Label htmlFor="hasBasement" className="cursor-pointer text-white">Has Basement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasGarage" 
                      checked={filters.hasGarage}
                      onCheckedChange={(checked) => handleFilterChange('hasGarage', Boolean(checked))}
                      className="border-[#0f1d31] data-[state=checked]:bg-[#FF7A00] data-[state=checked]:border-[#FF7A00]"
                    />
                    <Label htmlFor="hasGarage" className="cursor-pointer text-white">Has Garage</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  className="w-full bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white border-none" 
                  onClick={handleSearch}
                >
                  Search Properties
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-[#0f1d31] text-white hover:bg-[#071224] hover:text-[#FF7A00]" 
                  onClick={resetFilters}
                >
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
                <h2 className="text-xl font-bold text-white">
                  {isLoading ? (
                    <Skeleton className="h-7 w-32 bg-[#071224]" />
                  ) : (
                    `${totalItems} ${totalItems === 1 ? 'Property' : 'Properties'} Found`
                  )}
                </h2>
                <p className="text-sm text-slate-400">
                  {filters.location ? `Location: ${filters.location}` : 'All Locations'}
                  {filters.propertyType ? ` • Type: ${filters.propertyType}` : ''}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select
                  value={resultsPerPage.toString()}
                  onValueChange={(value) => setResultsPerPage(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px] bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:ring-1">
                    <SelectValue placeholder="Show" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                    <SelectItem value="6" className="focus:bg-[#0f1d31] focus:text-white">6 per page</SelectItem>
                    <SelectItem value="12" className="focus:bg-[#0f1d31] focus:text-white">12 per page</SelectItem>
                    <SelectItem value="24" className="focus:bg-[#0f1d31] focus:text-white">24 per page</SelectItem>
                    <SelectItem value="48" className="focus:bg-[#0f1d31] focus:text-white">48 per page</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="border border-[#0f1d31] rounded-md p-1 flex bg-[#050e1d]">
                  <Button 
                    variant={viewMode === "grid" ? "default" : "ghost"} 
                    size="icon" 
                    className={`h-8 w-8 ${viewMode === "grid" ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white" : "text-slate-400 hover:text-white hover:bg-[#071224]"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"} 
                    size="icon" 
                    className={`h-8 w-8 ${viewMode === "list" ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white" : "text-slate-400 hover:text-white hover:bg-[#071224]"}`}
                    onClick={() => setViewMode("list")}
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "map" ? "default" : "ghost"} 
                    size="icon" 
                    className={`h-8 w-8 ${viewMode === "map" ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white" : "text-slate-400 hover:text-white hover:bg-[#071224]"}`}
                    onClick={() => setViewMode("map")}
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="bg-[#0c1e36] border border-red-800 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-red-500 mb-2">Failed to load properties</h3>
                <p className="text-red-400">
                  {error instanceof Error ? error.message : 'An unknown error occurred'}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-red-800 text-red-500 hover:bg-[#071224] hover:text-red-400" 
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
                    <Card key={idx} className="overflow-hidden bg-[#050e1d] border-[#0f1d31]">
                      <Skeleton className="h-48 w-full bg-[#071224]" />
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2 bg-[#071224]" />
                        <Skeleton className="h-4 w-1/2 bg-[#071224]" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-full bg-[#071224]" />
                          <Skeleton className="h-4 w-2/3 bg-[#071224]" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Card key={idx} className="overflow-hidden bg-[#050e1d] border-[#0f1d31]">
                      <div className="flex flex-col sm:flex-row">
                        <Skeleton className="h-48 w-full sm:w-48 bg-[#071224]" />
                        <div className="p-6 flex-1">
                          <Skeleton className="h-6 w-3/4 mb-2 bg-[#071224]" />
                          <Skeleton className="h-4 w-1/2 mb-4 bg-[#071224]" />
                          <Skeleton className="h-4 w-full mb-2 bg-[#071224]" />
                          <Skeleton className="h-4 w-2/3 bg-[#071224]" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
            
            {/* No results state */}
            {!isLoading && (!paginatedProperties || paginatedProperties.length === 0) && !error && (
              <div className="bg-[#050e1d] border border-[#0f1d31] rounded-lg p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-white">No properties found</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  We couldn't find any properties matching your search criteria. Try adjusting your filters or search for a different location.
                </p>
                <Button 
                  onClick={resetFilters} 
                  className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white border-none"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
            
            {/* Grid view */}
            {!isLoading && paginatedProperties && paginatedProperties.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProperties.map((property: Property) => (
                  <Card key={property.id} className="overflow-hidden bg-[#050e1d] border-[#0f1d31]">
                    <div className="relative h-48 bg-[#071224]">
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
                          <Home className="h-12 w-12 text-slate-500/40" />
                        </div>
                      )}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="line-clamp-1 text-white">{property.address}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {property.city}, {property.state} {property.zipCode}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between mb-4">
                        <span className="text-xl font-bold text-[#FF7A00]">{formatPrice(property.price)}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex flex-col items-center p-2 bg-[#071224] rounded-md">
                          <div className="flex items-center gap-1 text-slate-400 mb-1">
                            <Bed className="h-3.5 w-3.5" />
                            <span>Beds</span>
                          </div>
                          <span className="font-medium text-white">{property.bedrooms}</span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-[#071224] rounded-md">
                          <div className="flex items-center gap-1 text-slate-400 mb-1">
                            <Bath className="h-3.5 w-3.5" />
                            <span>Baths</span>
                          </div>
                          <span className="font-medium text-white">{property.bathrooms}</span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-[#071224] rounded-md">
                          <div className="flex items-center gap-1 text-slate-400 mb-1">
                            <Ruler className="h-3.5 w-3.5" />
                            <span>Sq Ft</span>
                          </div>
                          <span className="font-medium text-white">
                            {parseInt(property.squareFeet).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-[#0f1d31] pt-4">
                      <Button className="w-full bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white border-none" asChild>
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
                  <Card key={property.id} className="overflow-hidden bg-[#050e1d] border-[#0f1d31]">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-48 h-48 bg-[#071224]">
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
                            <Home className="h-12 w-12 text-slate-500/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{property.address}</h3>
                            <p className="text-slate-400 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {property.city}, {property.state} {property.zipCode}
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0 text-xl font-bold text-[#FF7A00]">
                            {formatPrice(property.price)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 my-4">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{property.bedrooms} Beds</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{property.bathrooms} Baths</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Ruler className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{parseInt(property.squareFeet).toLocaleString()} sq ft</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Home className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{property.propertyType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarRange className="h-4 w-4 text-slate-400" />
                            <span className="text-white">Built {property.yearBuilt}</span>
                          </div>
                        </div>
                        
                        {property.description && (
                          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                            {property.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-end">
                          <Button className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white border-none" asChild>
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
              <Card className="bg-[#050e1d] border-[#0f1d31]">
                <CardContent className="p-6 text-center">
                  <MapIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-white">Map View Coming Soon</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
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
                        className={`${page <= 1 ? "pointer-events-none opacity-50" : ""} text-white border-[#0f1d31] hover:bg-[#071224] hover:text-[#FF7A00]`}
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
                                <PaginationEllipsis className="text-slate-400" />
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
                                className={page === pageNum 
                                  ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white border-[#FF7A00]" 
                                  : "text-white border-[#0f1d31] hover:bg-[#071224] hover:text-[#FF7A00]"
                                }
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
                        className={`${page >= totalPages ? "pointer-events-none opacity-50" : ""} text-white border-[#0f1d31] hover:bg-[#071224] hover:text-[#FF7A00]`}
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