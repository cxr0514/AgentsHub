import { useState } from "react";
import { Helmet } from "react-helmet";
import SearchFilters from "@/components/SearchFilters";
import PropertyTable from "@/components/PropertyTable";

const PropertySearch = () => {
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});
  
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
  
  return (
    <>
      <Helmet>
        <title>Property Search | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="Search for properties using advanced filters and find your perfect comparable properties." />
      </Helmet>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Property Search</h1>
          <p className="text-text-secondary">
            Search for properties using advanced filters
          </p>
        </div>
        
        <SearchFilters onSearch={handleSearch} />
        
        {Object.keys(searchFilters).length > 0 ? (
          <PropertyTable 
            filters={searchFilters} 
            title="Search Results" 
            showExport={true} 
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-text-secondary">
              Use the search filters above to find properties.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default PropertySearch;
