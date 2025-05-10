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
import { Plus } from "lucide-react";

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
}

const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const [location, setLocation] = useState<string>("San Francisco, CA");
  const [propertyType, setPropertyType] = useState<string>("Single Family");
  const [minPrice, setMinPrice] = useState<string>("500000");
  const [maxPrice, setMaxPrice] = useState<string>("1200000");
  const [beds, setBeds] = useState<string>("3+");
  const [baths, setBaths] = useState<string>("2+");
  
  const handleSearch = () => {
    const minBedsValue = beds.replace("+", "");
    const minBathsValue = baths.replace("+", "");
    
    const filters = {
      location,
      propertyType,
      minPrice,
      maxPrice,
      minBeds: minBedsValue,
      minBaths: minBathsValue
    };
    
    onSearch(filters);
  };
  
  const handleClear = () => {
    setLocation("San Francisco, CA");
    setPropertyType("Single Family");
    setMinPrice("500000");
    setMaxPrice("1200000");
    setBeds("3+");
    setBaths("2+");
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
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
      
      <div className="flex justify-between mt-4">
        <Button variant="link" className="text-accent hover:text-accent/80 font-medium">
          <Plus className="h-5 w-5 mr-1" />
          More Filters
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
