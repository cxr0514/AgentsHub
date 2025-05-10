import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import SearchFilters from "@/components/SearchFilters";
import MarketOverview from "@/components/MarketOverview";
import PropertyTable from "@/components/PropertyTable";
import SystemStatus from "@/components/SystemStatus";
import MLSStatus from "@/components/MLSStatus";

const Dashboard = () => {
  const [searchFilters, setSearchFilters] = useState({
    location: "San Francisco",
    state: "CA",
    propertyType: "Single Family"
  });

  const handleSearch = (filters: any) => {
    const locationParts = filters.location.split(", ");
    setSearchFilters({
      ...filters,
      location: locationParts[0],
      state: locationParts.length > 1 ? locationParts[1] : ""
    });
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="Find and analyze comparable properties quickly and efficiently with RealComp's property comparison dashboard." />
      </Helmet>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Property Comparison Dashboard</h1>
          <p className="text-text-secondary">Find and analyze comparable properties quickly and efficiently</p>
        </div>

        <SearchFilters onSearch={handleSearch} />
        
        <MarketOverview 
          city={searchFilters.location} 
          state={searchFilters.state} 
        />
        
        <PropertyTable 
          filters={searchFilters}
          title="Comparable Properties"
          showExport={true}
        />
      </div>
    </>
  );
};

export default Dashboard;
