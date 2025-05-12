import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Building2, Search, MapPin, Home, Bed, Bath, Ruler, DollarSign, Calendar, Clock, ListFilter, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Property type definition
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
}

// Filter state interface
interface FilterState {
  location: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  status: string;
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const [location, setLocation] = useState("");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    location: "",
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    minBaths: "",
    status: ""
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Build query params for API request
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.location) params.append("location", filters.location);
    if (filters.propertyType) params.append("propertyType", filters.propertyType);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.minBeds) params.append("minBeds", filters.minBeds);
    if (filters.minBaths) params.append("minBaths", filters.minBaths);
    if (filters.status) params.append("status", filters.status);
    
    return params.toString();
  };

  // Fetch properties with filters
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/properties', filters],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const url = queryParams ? `/api/properties?${queryParams}` : '/api/properties';
      
      // Use our apiRequest utility to make the request
      const response = await apiRequest('GET', url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      return response.json();
    }
  });

  // Handle filter changes
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Apply filters
  const applyFilters = () => {
    // Refetch will happen automatically because filters are part of the queryKey
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      location: "",
      propertyType: "",
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      minBaths: "",
      status: ""
    });
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

  // Format date for display (e.g., "3 days ago")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Get background color based on status
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
  const paginatedProperties = properties ? 
    properties.slice((page - 1) * pageSize, page * pageSize) : 
    [];
  
  const totalPages = properties ? 
    Math.ceil(properties.length / pageSize) : 
    0;

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
            <h1 className="text-3xl font-bold">Properties</h1>
            <p className="text-muted-foreground">Browse and manage real estate properties</p>
          </div>
          
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <ListFilter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Property Filters</SheetTitle>
                  <SheetDescription>
                    Narrow down properties by specific criteria
                  </SheetDescription>
                </SheetHeader>
                
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      placeholder="City, State, or ZIP" 
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Select 
                      value={filters.propertyType}
                      onValueChange={(value) => handleFilterChange('propertyType', value)}
                    >
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_types">All Types</SelectItem>
                        <SelectItem value="Single Family">Single Family</SelectItem>
                        <SelectItem value="Multi Family">Multi Family</SelectItem>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                        <SelectItem value="Land">Land</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minPrice">Min Price</Label>
                      <Select 
                        value={filters.minPrice}
                        onValueChange={(value) => handleFilterChange('minPrice', value)}
                      >
                        <SelectTrigger id="minPrice">
                          <SelectValue placeholder="No min" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_min">No min</SelectItem>
                          <SelectItem value="50000">$50,000</SelectItem>
                          <SelectItem value="100000">$100,000</SelectItem>
                          <SelectItem value="200000">$200,000</SelectItem>
                          <SelectItem value="300000">$300,000</SelectItem>
                          <SelectItem value="500000">$500,000</SelectItem>
                          <SelectItem value="750000">$750,000</SelectItem>
                          <SelectItem value="1000000">$1,000,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxPrice">Max Price</Label>
                      <Select 
                        value={filters.maxPrice}
                        onValueChange={(value) => handleFilterChange('maxPrice', value)}
                      >
                        <SelectTrigger id="maxPrice">
                          <SelectValue placeholder="No max" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_max">No max</SelectItem>
                          <SelectItem value="200000">$200,000</SelectItem>
                          <SelectItem value="300000">$300,000</SelectItem>
                          <SelectItem value="500000">$500,000</SelectItem>
                          <SelectItem value="750000">$750,000</SelectItem>
                          <SelectItem value="1000000">$1,000,000</SelectItem>
                          <SelectItem value="1500000">$1,500,000</SelectItem>
                          <SelectItem value="2000000">$2,000,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="beds">Beds</Label>
                      <Select 
                        value={filters.minBeds}
                        onValueChange={(value) => handleFilterChange('minBeds', value)}
                      >
                        <SelectTrigger id="beds">
                          <SelectValue placeholder="Any" />
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
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="baths">Baths</Label>
                      <Select 
                        value={filters.minBaths}
                        onValueChange={(value) => handleFilterChange('minBaths', value)}
                      >
                        <SelectTrigger id="baths">
                          <SelectValue placeholder="Any" />
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
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_status">Any status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetFilters}>Reset All</Button>
                  <Button onClick={applyFilters}>Apply Filters</Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button className="bg-[#FF7A00]">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Search and view options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search properties by address, city, or zip" 
              className="pl-10 bg-[#050e1d] border-[#0f1d31] text-white placeholder:text-[#8A93A6] focus-visible:ring-0 focus-visible:border-[#FF7A00]"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[180px] bg-[#050e1d] border-[#0f1d31] text-white focus:ring-0 focus:border-[#FF7A00]">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_properties">All Properties</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewType === "grid" ? "default" : "outline"} 
                    size="icon"
                    className={viewType === "grid" ? "bg-[#FF7A00]" : "border-[#0f1d31] bg-[#050e1d] text-white"}
                    onClick={() => setViewType("grid")}
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewType === "list" ? "default" : "outline"} 
                    size="icon"
                    className={viewType === "list" ? "bg-[#FF7A00]" : "border-[#0f1d31] bg-[#050e1d] text-white"}
                    onClick={() => setViewType("list")}
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load properties</h3>
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#0f1d31] bg-[#050e1d]/80 text-white hover:bg-[#FF7A00]/10 hover:text-[#FF7A00]" 
              onClick={() => applyFilters()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* No results state */}
        {!isLoading && properties && properties.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-6">
              No properties match your current filters. Try adjusting your search criteria.
            </p>
            <Button onClick={resetFilters} className="bg-[#FF7A00] hover:bg-[#FF9832]">Clear All Filters</Button>
          </div>
        )}

        {/* Grid view */}
        {!isLoading && properties && properties.length > 0 && viewType === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProperties.map((property: Property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="relative h-48 bg-muted">
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Home className="h-12 w-12 text-muted-foreground/40" />
                  </div>
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
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(property.createdAt)}
                      </span>
                    </div>
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
                  <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d]/80 text-white hover:bg-[#FF7A00]/10 hover:text-[#FF7A00]" asChild>
                    <Link href={`/properties/${property.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* List view */}
        {!isLoading && properties && properties.length > 0 && viewType === "list" && (
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
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home className="h-12 w-12 text-muted-foreground/40" />
                    </div>
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
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Built {property.yearBuilt}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(property.createdAt)}</span>
                      </div>
                      <Button asChild className="bg-[#FF7A00] hover:bg-[#FF9832]">
                        <Link href={`/properties/${property.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && properties && properties.length > 0 && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p => Math.max(1, p - 1));
                    }}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
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
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p => Math.min(totalPages, p + 1));
                    }}
                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}