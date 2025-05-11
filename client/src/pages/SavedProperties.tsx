import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Property, SavedProperty } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropertyCard from "@/components/PropertyCard";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Mock user ID - in a real app this would come from auth
const userId = 1; 

const SavedProperties = () => {
  const { toast } = useToast();
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  
  const { 
    data: savedProperties, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: [`/api/users/${userId}/saved-properties`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/saved-properties`);
      if (!response.ok) {
        throw new Error('Failed to fetch saved properties');
      }
      return await response.json();
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/saved-properties/${id}`);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Property removed",
        description: "The property has been removed from your saved list",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove property: ${error}`,
        variant: "destructive",
      });
    }
  });

  const handleRemoveProperty = (savedPropertyId: number) => {
    removeMutation.mutate(savedPropertyId);
  };
  
  // Filter properties based on active tab
  const filteredProperties = savedProperties ? savedProperties.filter((savedProperty: SavedProperty & { property: Property }) => {
    if (activeTab === "all") return true;
    return savedProperty.property.status.toLowerCase() === activeTab.toLowerCase();
  }) : [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Saved Properties</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="h-48 bg-gray-200 rounded-t-lg w-full"></div>
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Saved Properties | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="View and manage your saved properties. Compare favorites and make informed real estate decisions." />
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Saved Properties</h1>
          <p className="text-text-secondary">
            Manage your favorite properties and comparisons
          </p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="all">All Properties</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="sold">Sold</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex space-x-2">
            <Button 
              variant={viewType === "grid" ? "default" : "outline"} 
              onClick={() => setViewType("grid")}
              size="sm"
            >
              Grid
            </Button>
            <Button 
              variant={viewType === "list" ? "default" : "outline"} 
              onClick={() => setViewType("list")}
              size="sm"
            >
              List
            </Button>
          </div>
        </div>
        
        {!savedProperties || filteredProperties.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary mb-4">You haven't saved any properties yet.</p>
            <Button variant="default" className="bg-accent hover:bg-accent/90">
              Start Searching
            </Button>
          </Card>
        ) : viewType === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((savedProperty: SavedProperty & { property: Property }) => (
              <div key={savedProperty.id} className="relative flex flex-col h-full">
                <div className="flex-1 mb-2">
                  <PropertyCard 
                    property={savedProperty.property} 
                    isSaved={true}
                    onSave={() => handleRemoveProperty(savedProperty.id)}
                  />
                </div>
                {savedProperty.notes && (
                  <Card className="bg-accent/5 border-accent/20">
                    <CardContent className="p-3">
                      <p className="text-sm line-clamp-2 overflow-hidden text-ellipsis">{savedProperty.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Property</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Notes</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((savedProperty: SavedProperty & { property: Property }) => (
                  <tr key={savedProperty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img 
                          className="h-12 w-16 object-cover rounded-md mr-4" 
                          src={
                            (() => {
                              try {
                                const images = typeof savedProperty.property.images === 'string' 
                                  ? JSON.parse(savedProperty.property.images) 
                                  : savedProperty.property.images;
                                return images[0];
                              } catch (error) {
                                console.error("Error parsing images:", error);
                                return "";
                              }
                            })()
                          } 
                          alt={savedProperty.property.address} 
                        />
                        <div>
                          <div className="font-medium text-primary">{savedProperty.property.address}</div>
                          <div className="text-sm text-text-secondary">
                            {savedProperty.property.city}, {savedProperty.property.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">${Number(savedProperty.property.price).toLocaleString()}</div>
                      <div className="text-xs text-text-secondary">${savedProperty.property.pricePerSqft}/sqft</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{savedProperty.property.bedrooms} bed / {savedProperty.property.bathrooms} bath</div>
                      <div className="text-xs text-text-secondary">{Number(savedProperty.property.squareFeet).toLocaleString()} sqft</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={savedProperty.property.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{savedProperty.notes || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/properties/${savedProperty.property.id}`}>
                        <Button 
                          variant="link" 
                          className="text-accent hover:text-accent/80"
                        >
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="link" 
                        className="text-secondary hover:text-secondary/80"
                        onClick={() => handleRemoveProperty(savedProperty.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  // Ensure we have a valid status string
  const statusText = status?.toString() || 'Unknown';
  
  switch (statusText.toLowerCase()) {
    case 'active':
      return (
        <span className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
    case 'pending':
      return (
        <span className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    case 'sold':
      return (
        <span className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          Sold
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {statusText}
        </span>
      );
  }
};

export default SavedProperties;
