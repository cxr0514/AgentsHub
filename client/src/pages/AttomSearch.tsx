import { useState } from "react";
import { Helmet } from "react-helmet";
import { Property } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AttomPropertySearch from "@/components/AttomPropertySearch";
import PropertyTable from "@/components/PropertyTable";
import MapSearch from "@/components/MapSearch";
import { Table, Map, Building, Info, ExternalLink } from "lucide-react";

const AttomSearch = () => {
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [viewMode, setViewMode] = useState<string>("table");

  // Handle new search results from AttomPropertySearch
  const handleResultsLoaded = (properties: Property[]) => {
    setSearchResults(properties);
  };

  return (
    <>
      <Helmet>
        <title>ATTOM Property Search | RealComp - Real Estate Comparison Tool</title>
        <meta 
          name="description" 
          content="Search for properties using ATTOM Data API integration with our specialized search tools." 
        />
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">ATTOM Property Search</h1>
            <p className="text-text-secondary">
              Specialized search interface using ATTOM API data integration
            </p>
          </div>
          
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href="https://api.gateway.attomdata.com/propertyapi/swagger/index.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ATTOM API Documentation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="col-span-1">
            <AttomPropertySearch onResultsLoaded={handleResultsLoaded} />
            
            {/* Search Info */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    ATTOM Data Integration
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>
                  This search interface connects directly to the ATTOM Property API, 
                  providing comprehensive property data.
                </p>
                <div className="mt-2">
                  <p className="mb-1 font-medium">Available Search Methods:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Address Search - Find properties by specific address</li>
                    <li>Postal Code - Search by ZIP code</li>
                    <li>Geo Search - Find properties within a radius of coordinates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Results Panel */}
          <div className="col-span-1 lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Search Results</CardTitle>
                  
                  {/* View Mode Toggle */}
                  <div className="inline-flex rounded-md shadow-sm">
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      className={`${viewMode === "table" ? "bg-primary hover:bg-primary/90" : ""} rounded-l-md rounded-r-none px-3`}
                      onClick={() => setViewMode("table")}
                      size="sm"
                    >
                      <Table className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === "map" ? "default" : "outline"}
                      className={`${viewMode === "map" ? "bg-primary hover:bg-primary/90" : ""} rounded-l-none rounded-r-md px-3`}
                      onClick={() => setViewMode("map")}
                      size="sm"
                    >
                      <Map className="h-4 w-4 mr-2" />
                      Map
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {searchResults.length > 0
                    ? `Showing ${searchResults.length} properties`
                    : "Search for properties to see results"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No properties found</p>
                    <p className="text-sm mt-1">Try adjusting your search criteria</p>
                  </div>
                ) : viewMode === "table" ? (
                  // Table view
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2 text-sm font-medium">Address</th>
                          <th className="px-4 py-2 text-sm font-medium">Price</th>
                          <th className="px-4 py-2 text-sm font-medium">Beds</th>
                          <th className="px-4 py-2 text-sm font-medium">Baths</th>
                          <th className="px-4 py-2 text-sm font-medium">Type</th>
                          <th className="px-4 py-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((property) => (
                          <tr 
                            key={property.id} 
                            className="border-t hover:bg-gray-50 cursor-pointer"
                            onClick={() => window.location.href = `/properties/${property.id}`}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium">{property.address}</div>
                              <div className="text-xs text-gray-500">
                                {property.city}, {property.state} {property.zipCode}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {property.price ? (
                                <span>${parseInt(property.price).toLocaleString()}</span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3">{property.bedrooms}</td>
                            <td className="px-4 py-3">{property.bathrooms}</td>
                            <td className="px-4 py-3">{property.propertyType}</td>
                            <td className="px-4 py-3">
                              <Badge variant={
                                property.status === "Active" ? "default" :
                                property.status === "Pending" ? "secondary" :
                                property.status === "Sold" ? "outline" : "default"
                              }>
                                {property.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Map view
                  <div className="h-[600px]">
                    <MapSearch 
                      properties={searchResults} 
                      onPropertySelect={(property) => {
                        window.location.href = `/properties/${property.id}`;
                      }} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttomSearch;