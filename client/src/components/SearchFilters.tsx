import { useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { format } from "date-fns";

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
}

const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  // Basic filters
  const [location, setLocation] = useState<string>("San Francisco, CA");
  const [propertyType, setPropertyType] = useState<string>("Single Family");
  const [minPrice, setMinPrice] = useState<string>("500000");
  const [maxPrice, setMaxPrice] = useState<string>("1200000");
  const [beds, setBeds] = useState<string>("3+");
  const [baths, setBaths] = useState<string>("2+");
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [zipCode, setZipCode] = useState<string>("");
  const [radius, setRadius] = useState<string>("5");
  const [minSqft, setMinSqft] = useState<string>("");
  const [maxSqft, setMaxSqft] = useState<string>("");
  const [yearBuilt, setYearBuilt] = useState<string>("any_year");
  const [hasBasement, setHasBasement] = useState<boolean>(false);
  const [hasGarage, setHasGarage] = useState<boolean>(false);
  const [minGarageSpaces, setMinGarageSpaces] = useState<string>("0");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Active"]);
  const [saleDateStart, setSaleDateStart] = useState<Date | undefined>(undefined);
  const [saleDateEnd, setSaleDateEnd] = useState<Date | undefined>(undefined);
  
  const handleSearch = () => {
    // Extract numeric values from formatted inputs
    const minBedsValue = beds.replace("+", "");
    const minBathsValue = baths.replace("+", "");
    
    // Calculate bed/bath ranges for comps (±1)
    const maxBedsValue = parseInt(minBedsValue) + 1;
    const maxBathsValue = (parseFloat(minBathsValue) + 1).toString();
    
    // Build the filter object
    const filters: any = {
      location,
      propertyType,
      minPrice,
      maxPrice,
      minBeds: minBedsValue,
      maxBeds: maxBedsValue.toString(),
      minBaths: minBathsValue,
      maxBaths: maxBathsValue,
      statusList: selectedStatuses
    };
    
    // Add advanced filters if enabled
    if (showAdvancedFilters) {
      if (zipCode) filters.zipCode = zipCode;
      if (radius) filters.radius = radius;
      if (minSqft) filters.minSqft = minSqft;
      if (maxSqft) filters.maxSqft = maxSqft;
      // Add yearBuilt filter (will be "any_year" by default)
      filters.yearBuilt = yearBuilt;
      if (hasBasement) filters.hasBasement = hasBasement;
      if (hasGarage) filters.hasGarage = hasGarage;
      if (parseInt(minGarageSpaces) > 0) filters.minGarageSpaces = parseInt(minGarageSpaces);
      if (saleDateStart) filters.saleDateStart = format(saleDateStart, 'yyyy-MM-dd');
      if (saleDateEnd) filters.saleDateEnd = format(saleDateEnd, 'yyyy-MM-dd');
    }
    
    onSearch(filters);
  };
  
  const handleClear = () => {
    // Reset basic filters
    setLocation("San Francisco, CA");
    setPropertyType("Single Family");
    setMinPrice("500000");
    setMaxPrice("1200000");
    setBeds("3+");
    setBaths("2+");
    
    // Reset advanced filters
    setZipCode("");
    setRadius("5");
    setMinSqft("");
    setMaxSqft("");
    setYearBuilt("any_year");
    setHasBasement(false);
    setHasGarage(false);
    setMinGarageSpaces("0");
    setSelectedStatuses(["Active"]);
    setSaleDateStart(undefined);
    setSaleDateEnd(undefined);
  };
  
  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
              <SelectItem value="New York, NY">New York, NY</SelectItem>
              <SelectItem value="Los Angeles, CA">Los Angeles, CA</SelectItem>
              <SelectItem value="Chicago, IL">Chicago, IL</SelectItem>
              <SelectItem value="Austin, TX">Austin, TX</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Property Type</label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single Family">Single Family</SelectItem>
              <SelectItem value="Condo">Condo</SelectItem>
              <SelectItem value="Townhouse">Townhouse</SelectItem>
              <SelectItem value="Multi-Family">Multi-Family</SelectItem>
              <SelectItem value="Land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Price Range</label>
          <div className="flex items-center">
            <Input
              type="text"
              placeholder="Min"
              value={`$${Number(minPrice).toLocaleString()}`}
              onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))}
              className="rounded-l-md rounded-r-none"
            />
            <div className="px-2">-</div>
            <Input
              type="text"
              placeholder="Max"
              value={`$${Number(maxPrice).toLocaleString()}`}
              onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
              className="rounded-l-none rounded-r-md"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Beds/Baths</label>
          <div className="flex items-center">
            <Select value={beds} onValueChange={setBeds}>
              <SelectTrigger className="rounded-l-md rounded-r-none">
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1+">1+ Beds</SelectItem>
                <SelectItem value="2+">2+ Beds</SelectItem>
                <SelectItem value="3+">3+ Beds</SelectItem>
                <SelectItem value="4+">4+ Beds</SelectItem>
                <SelectItem value="5+">5+ Beds</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={baths} onValueChange={setBaths}>
              <SelectTrigger className="rounded-l-none rounded-r-md">
                <SelectValue placeholder="Baths" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1+">1+ Baths</SelectItem>
                <SelectItem value="2+">2+ Baths</SelectItem>
                <SelectItem value="3+">3+ Baths</SelectItem>
                <SelectItem value="4+">4+ Baths</SelectItem>
                <SelectItem value="5+">5+ Baths</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location Filters */}
            <div>
              <label className="block text-sm font-medium mb-1">ZIP Code</label>
              <Input 
                type="text" 
                placeholder="Enter ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Search Radius (miles)</label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger>
                  <SelectValue placeholder="Select radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mile</SelectItem>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Square Footage */}
            <div>
              <label className="block text-sm font-medium mb-1">Square Footage</label>
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="Min sqft"
                  value={minSqft ? Number(minSqft).toLocaleString() : ""}
                  onChange={(e) => setMinSqft(e.target.value.replace(/[^0-9]/g, ''))}
                  className="rounded-l-md rounded-r-none"
                />
                <div className="px-2">-</div>
                <Input
                  type="text"
                  placeholder="Max sqft"
                  value={maxSqft ? Number(maxSqft).toLocaleString() : ""}
                  onChange={(e) => setMaxSqft(e.target.value.replace(/[^0-9]/g, ''))}
                  className="rounded-l-none rounded-r-md"
                />
              </div>
            </div>
            
            {/* Property Features */}
            <div>
              <label className="block text-sm font-medium mb-2">Property Status</label>
              <div className="flex flex-wrap gap-2">
                {['Active', 'Pending', 'Sold'].map(status => (
                  <div 
                    key={status}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                      selectedStatuses.includes(status) 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => toggleStatus(status)}
                  >
                    {status}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Year Built Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Year Built</label>
              <Select value={yearBuilt} onValueChange={setYearBuilt}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year built" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_year">Any Year</SelectItem>
                  <SelectItem value="2020">2020 or newer</SelectItem>
                  <SelectItem value="2010">2010 or newer</SelectItem>
                  <SelectItem value="2000">2000 or newer</SelectItem>
                  <SelectItem value="1990">1990 or newer</SelectItem>
                  <SelectItem value="1980">1980 or newer</SelectItem>
                  <SelectItem value="1970">1970 or newer</SelectItem>
                  <SelectItem value="1960">1960 or newer</SelectItem>
                  <SelectItem value="1950">1950 or newer</SelectItem>
                  <SelectItem value="1940">1940 or newer</SelectItem>
                  <SelectItem value="1930">1930 or newer</SelectItem>
                  <SelectItem value="1920">1920 or newer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional Filters */}
            <div>
              <label className="block text-sm font-medium mb-2">Additional Features</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-basement" 
                    checked={hasBasement}
                    onCheckedChange={(checked) => setHasBasement(!!checked)}
                  />
                  <label htmlFor="has-basement" className="text-sm">Has Basement</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-garage" 
                    checked={hasGarage}
                    onCheckedChange={(checked) => setHasGarage(!!checked)}
                  />
                  <label htmlFor="has-garage" className="text-sm">Has Garage</label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Min. Garage Spaces</label>
              <Select value={minGarageSpaces} onValueChange={setMinGarageSpaces}>
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Sale Date Range (for Sold comps) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1">Sale Date Range (for Sold comps)</label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {saleDateStart ? format(saleDateStart, 'PPP') : 'Start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={saleDateStart}
                        onSelect={setSaleDateStart}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {saleDateEnd ? format(saleDateEnd, 'PPP') : 'End date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={saleDateEnd}
                        onSelect={setSaleDateEnd}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {(saleDateStart || saleDateEnd) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSaleDateStart(undefined);
                      setSaleDateEnd(undefined);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear dates
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="link" 
          className="text-accent hover:text-accent/80 font-medium"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? (
            <>
              <ChevronUp className="h-5 w-5 mr-1" />
              Hide Advanced Filters
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-1" />
              Show Advanced Filters
            </>
          )}
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleClear}>Clear</Button>
          <Button variant="default" className="bg-primary hover:bg-primary/90" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
