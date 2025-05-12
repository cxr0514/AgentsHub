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
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, 
} from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@shared/schema";

interface AttomPropertySearchProps {
  onResultsLoaded?: (properties: Property[]) => void;
}

const AttomPropertySearch = ({ onResultsLoaded }: AttomPropertySearchProps) => {
  const { toast } = useToast();

  // Search methods
  const [searchMethod, setSearchMethod] = useState<string>("address");
  
  // Search parameters
  const [postalCode, setPostalCode] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("GA");
  const [propertyType, setPropertyType] = useState<string>("Single Family");
  
  // Additional parameters for geo search
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [radius, setRadius] = useState<string>("5");
  
  // State for search results and loading
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<Property[]>([]);
  const [searchCompleted, setSearchCompleted] = useState<boolean>(false);

  // Handle search based on selected method
  const handleSearch = async () => {
    setIsSearching(true);
    setSearchCompleted(false);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (searchMethod === "address") {
        // For address search (with full address, city, state)
        if (address) queryParams.append("location", address);
        if (city) queryParams.append("city", city);  
        if (state) queryParams.append("state", state);
      } else if (searchMethod === "postal") {
        // For postal code search
        if (postalCode) queryParams.append("zipCode", postalCode);
      } else if (searchMethod === "geo") {
        // For geo search with lat/lng and radius
        if (latitude && longitude) {
          queryParams.append("lat", latitude);
          queryParams.append("lng", longitude);
          queryParams.append("radius", radius);
        } else {
          throw new Error("Latitude and longitude are required for geo search");
        }
      }
      
      // Add property type to search
      if (propertyType) {
        queryParams.append("propertyType", propertyType);
      }
      
      console.log(`Searching properties with params: ${queryParams.toString()}`);
      
      // Make API request to our backend
      const response = await fetch(`/api/properties/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to search properties");
      }
      
      const data = await response.json();
      
      // Store results
      setResults(data);
      
      // Notify parent component if callback provided
      if (onResultsLoaded) {
        onResultsLoaded(data);
      }
      
      // Show success or empty results message
      if (data.length === 0) {
        toast({
          title: "No properties found",
          description: "Try adjusting your search criteria",
          variant: "default"
        });
      } else {
        toast({
          title: "Search completed",
          description: `Found ${data.length} properties`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error searching properties:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search properties",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsSearching(false);
      setSearchCompleted(true);
    }
  };

  // Reset search form
  const handleReset = () => {
    // Reset search method
    setSearchMethod("address");
    
    // Reset search parameters
    setPostalCode("");
    setAddress("");
    setCity("");
    setState("GA");
    setPropertyType("Single Family");
    
    // Reset geo search parameters
    setLatitude("");
    setLongitude("");
    setRadius("5");
    
    // Clear results
    setResults([]);
    setSearchCompleted(false);
    
    // Clear results in parent component if callback provided
    if (onResultsLoaded) {
      onResultsLoaded([]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ATTOM Property Search</CardTitle>
        <CardDescription>
          Search for properties using the ATTOM API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Search Method</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={searchMethod === "address" ? "default" : "outline"}
              onClick={() => setSearchMethod("address")}
              className="flex-1"
            >
              Address Search
            </Button>
            <Button
              variant={searchMethod === "postal" ? "default" : "outline"}
              onClick={() => setSearchMethod("postal")}
              className="flex-1"
            >
              Postal Code
            </Button>
            <Button
              variant={searchMethod === "geo" ? "default" : "outline"}
              onClick={() => setSearchMethod("geo")}
              className="flex-1"
            >
              Geo Search
            </Button>
          </div>
        </div>

        {/* Address Search Form */}
        {searchMethod === "address" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                type="text"
                placeholder="Enter street address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input
                  type="text"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="CT">Connecticut</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="HI">Hawaii</SelectItem>
                    <SelectItem value="ID">Idaho</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IA">Iowa</SelectItem>
                    <SelectItem value="KS">Kansas</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="LA">Louisiana</SelectItem>
                    <SelectItem value="ME">Maine</SelectItem>
                    <SelectItem value="MD">Maryland</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="MN">Minnesota</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="MO">Missouri</SelectItem>
                    <SelectItem value="MT">Montana</SelectItem>
                    <SelectItem value="NE">Nebraska</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                    <SelectItem value="NH">New Hampshire</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="NM">New Mexico</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="ND">North Dakota</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="OK">Oklahoma</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="SD">South Dakota</SelectItem>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="UT">Utah</SelectItem>
                    <SelectItem value="VT">Vermont</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="WV">West Virginia</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="WY">Wyoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Postal Code Search Form */}
        {searchMethod === "postal" && (
          <div>
            <label className="block text-sm font-medium mb-1">Postal Code</label>
            <Input
              type="text"
              placeholder="Enter 5-digit ZIP code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').substring(0, 5))}
              maxLength={5}
            />
          </div>
        )}

        {/* Geo Search Form */}
        {searchMethod === "geo" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="e.g., 33.749"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="e.g., -84.388"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search Radius (miles)</label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger>
                  <SelectValue placeholder="Select radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mile</SelectItem>
                  <SelectItem value="2">2 miles</SelectItem>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="20">20 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Property Type (common for all search methods) */}
        <div className="mt-4 mb-6">
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSearching}
          >
            Reset
          </Button>
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Results Summary (if search completed) */}
        {searchCompleted && (
          <div className="mt-4 p-2 text-center text-sm border-t pt-4">
            {results.length > 0 ? (
              <p className="text-green-600">Found {results.length} properties</p>
            ) : (
              <p className="text-yellow-600">No properties found for this search</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttomPropertySearch;