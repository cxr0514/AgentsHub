import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Property, PropertyHistory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PropertyImages from "./PropertyImages";
import { 
  Bookmark, 
  Share2, 
  FileText, 
  MapPin 
} from "lucide-react";

interface PropertyDetailsProps {
  propertyId: number;
}

const PropertyDetails = ({ propertyId }: PropertyDetailsProps) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const { data: property, isLoading: isPropertyLoading } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      return await response.json();
    }
  });

  const { data: propertyHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: [`/api/properties/${propertyId}/history`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch property history');
      }
      return await response.json();
    }
  });

  if (isPropertyLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-md overflow-hidden mb-6 animate-pulse">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="h-80 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-8 text-center">
          <p className="text-text-secondary">Property not found.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Property Details</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex items-center">
              <Bookmark className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center bg-primary hover:bg-primary/90"
            >
              <FileText className="h-4 w-4 mr-1" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="p-4">
          <PropertyImages 
            images={JSON.parse(property.images as string)} 
            address={property.address} 
            city={property.city} 
            state={property.state} 
            zipCode={property.zipCode} 
            neighborhood={property.neighborhood}
          />
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Property Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-text-secondary">Price</div>
                <div className="font-medium">${Number(property.price).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Price per Sq Ft</div>
                <div className="font-medium">${property.pricePerSqft}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Property Type</div>
                <div className="font-medium">{property.propertyType}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Year Built</div>
                <div className="font-medium">{property.yearBuilt}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Bedrooms</div>
                <div className="font-medium">{property.bedrooms}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Bathrooms</div>
                <div className="font-medium">{property.bathrooms}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Living Area</div>
                <div className="font-medium">{Number(property.squareFeet).toLocaleString()} sq ft</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Lot Size</div>
                <div className="font-medium">
                  {property.lotSize ? `${Number(property.lotSize).toLocaleString()} sq ft` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Status</div>
                <StatusText status={property.status} />
              </div>
              <div>
                <div className="text-sm text-text-secondary">Days on Market</div>
                <div className="font-medium">{property.daysOnMarket || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t md:border-t-0 md:border-l border-gray-200">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Location</h3>
              <div className="h-56 rounded-lg map-container flex justify-center items-center">
                <div className="text-center text-text-secondary">
                  <MapPin className="h-10 w-10 mx-auto mb-2 text-accent" />
                  <span>Map View</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Neighborhood Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-text-secondary">Walk Score</div>
                  <div className="font-medium">88 - Very Walkable</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">Transit Score</div>
                  <div className="font-medium">92 - Excellent Transit</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">School District</div>
                  <div className="font-medium">San Francisco Unified</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">School Rating</div>
                  <div className="font-medium">8/10</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Property History</h3>
              <div className="space-y-3">
                {isHistoryLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex">
                        <div className="w-20 flex-shrink-0 h-4 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : propertyHistory && propertyHistory.length > 0 ? (
                  propertyHistory.map((history: PropertyHistory) => (
                    <div key={history.id} className="flex">
                      <div className="w-20 flex-shrink-0 text-sm text-text-secondary">
                        {new Date(history.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <div>
                        <div className="font-medium">
                          {history.event.charAt(0).toUpperCase() + history.event.slice(1)} for ${Number(history.price).toLocaleString()}
                        </div>
                        <div className="text-sm text-text-secondary">
                          ${(Number(history.price) / Number(property.squareFeet)).toFixed(0)} per square foot
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-text-secondary">No property history available.</div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Tax Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-text-secondary">Annual Tax</div>
                  <div className="font-medium">$19,788</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">Tax Rate</div>
                  <div className="font-medium">1.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const StatusText = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case 'active':
      return <div className="font-medium text-success">Active</div>;
    case 'pending':
      return <div className="font-medium text-secondary">Pending</div>;
    case 'sold':
      return <div className="font-medium">Sold</div>;
    default:
      return <div className="font-medium">{status}</div>;
  }
};

export default PropertyDetails;
