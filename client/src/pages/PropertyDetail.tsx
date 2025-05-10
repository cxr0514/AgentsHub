import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import PropertyDetails from "@/components/PropertyDetails";
import PropertyTable from "@/components/PropertyTable";
import { Card } from "@/components/ui/card";

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id);
  
  const { data: property, isLoading } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      return await response.json();
    }
  });
  
  if (isNaN(propertyId)) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <p className="text-text-secondary">Invalid property ID</p>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>
          {isLoading ? "Loading Property..." : property ? `${property.address}, ${property.city} | RealComp` : "Property Details | RealComp"}
        </title>
        <meta 
          name="description" 
          content={
            property 
              ? `View details for ${property.bedrooms} bed, ${property.bathrooms} bath, ${Number(property.squareFeet).toLocaleString()} sq ft property at ${property.address}, ${property.city}, ${property.state}.` 
              : "Detailed property information and comparable properties."
          } 
        />
      </Helmet>
      
      <div className="container mx-auto p-4">
        <PropertyDetails propertyId={propertyId} />
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Similar Properties</h2>
          
          {property ? (
            <PropertyTable 
              filters={{
                propertyType: property.propertyType,
                minBeds: Math.max(1, property.bedrooms - 1),
                maxBeds: property.bedrooms + 1,
                minPrice: Number(property.price) * 0.8,
                maxPrice: Number(property.price) * 1.2,
                location: property.city
              }} 
              title="" 
              showExport={false} 
            />
          ) : (
            <Card className="p-4 text-center">
              <p className="text-text-secondary">Loading similar properties...</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default PropertyDetail;
