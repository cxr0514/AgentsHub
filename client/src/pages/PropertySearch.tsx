import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SearchFilters from "@/components/SearchFilters";
import PropertyTable from "@/components/PropertyTable";
import MapSearch from "@/components/MapSearch";
import CsvUploadDialog from "@/components/CsvUploadDialog";
import AddPropertyDialog from "@/components/AddPropertyDialog";
import { Table, Map, Upload, FileUp, Plus } from "lucide-react";

const PropertySearch = () => {
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<string>("list");
  const [properties, setProperties] = useState<Property[]>([]);
  const [showCsvUploadDialog, setShowCsvUploadDialog] = useState(false);
  
  // Fetch properties with integrated search that combines local DB and MLS data
  const { data: fetchedProperties, isLoading, refetch } = useQuery({
    queryKey: ['/api/properties/search', searchFilters],
    queryFn: async () => {
      // If we have filters, use them to filter properties
      if (Object.keys(searchFilters).length > 0) {
        const queryParams = new URLSearchParams();
        
        for (const [key, value] of Object.entries(searchFilters)) {
          if (value) {
            queryParams.append(key, value.toString());
          }
        }
        
        // Use the dedicated search endpoint that combines local DB and MLS data
        const url = `/api/properties/search?${queryParams.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        return await response.json();
      } else {
        // Otherwise, get all properties, but still use search endpoint with empty params
        // to take advantage of the integrated search functionality
        const response = await fetch('/api/properties/search');
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        return await response.json();
      }
    },
    enabled: true,
  });
  
  // Update properties when data is fetched
  useEffect(() => {
    if (fetchedProperties) {
      setProperties(fetchedProperties);
    }
  }, [fetchedProperties]);
  
  const handleSearch = (filters: any) => {
    const locationParts = filters.location.split(", ");
    const city = locationParts[0];
    const state = locationParts.length > 1 ? locationParts[1] : "";
    
    setSearchFilters({
      location: city,
      state: state,
      propertyType: filters.propertyType,
      minPrice: filters.minPrice.replace(/\D/g, ''),
      maxPrice: filters.maxPrice.replace(/\D/g, ''),
      minBeds: filters.minBeds.replace(/\+/g, ''),
      minBaths: filters.minBaths.replace(/\+/g, '')
    });
  };
  
  const handlePropertyAdded = () => {
    // Refetch properties when a new one is added
    refetch();
  };
  
  return (
    <>
      <Helmet>
        <title>Property Search | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="Search for properties using advanced filters and find your perfect comparable properties." />
      </Helmet>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Property Search</h1>
              <p className="text-text-secondary">
                Search for properties using advanced filters
              </p>
            </div>
            <div className="flex gap-4">
              <AddPropertyDialog onAddSuccess={handlePropertyAdded} />
              
              <Button
                variant="outline"
                className="border-accent text-accent hover:bg-accent/10"
                onClick={() => setShowCsvUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              
              <div className="inline-flex rounded-md shadow-sm">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  className={`${viewMode === "list" ? "bg-primary hover:bg-primary/90" : ""} rounded-l-md rounded-r-none`}
                  onClick={() => setViewMode("list")}
                >
                  <Table className="h-4 w-4 mr-2" />
                  List View
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  className={`${viewMode === "map" ? "bg-primary hover:bg-primary/90" : ""} rounded-l-none rounded-r-md`}
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4 mr-2" />
                  Map View
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <SearchFilters onSearch={handleSearch} />
        
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-32 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        ) : viewMode === "list" ? (
          // List View
          properties.length > 0 ? (
            <PropertyTable 
              filters={searchFilters} 
              title="Search Results" 
              showExport={true} 
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-text-secondary">
                No properties found that match your search criteria.
              </p>
            </div>
          )
        ) : (
          // Map View
          <div className="bg-white rounded-lg shadow-md p-4">
            <MapSearch 
              properties={properties} 
              onPropertySelect={(property) => {
                // Navigate to property details
                window.location.href = `/properties/${property.id}`;
              }} 
            />
          </div>
        )}
      </div>
      
      {/* CSV Upload Dialog */}
      <CsvUploadDialog 
        open={showCsvUploadDialog}
        onOpenChange={setShowCsvUploadDialog}
      />
    </>
  );
};

export default PropertySearch;
