import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { generatePropertyComparisonReport } from "@/lib/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Property } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowDownNarrowWide, 
  Trash2, 
  FileText, 
  Download
} from "lucide-react";

interface PropertyTableProps {
  filters?: any;
  title?: string;
  showExport?: boolean;
}

const PropertyTable = ({ filters = {}, title = "Comparable Properties", showExport = true }: PropertyTableProps) => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<string>("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isExporting, setIsExporting] = useState(false);

  const queryString = new URLSearchParams(filters).toString();
  
  const { data: properties, isLoading } = useQuery({
    queryKey: [`/api/properties${queryString ? `?${queryString}` : ''}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      
      // Now that our API correctly returns arrays, we can simplify this code
      return data.map((property: any) => {
        // Images should already be an array from our API, but add validation just in case
        const parsedImages = Array.isArray(property.images) 
          ? property.images 
          : (typeof property.images === 'string' && property.images.includes('http') 
            ? [property.images] 
            : []);
            
        // Features should already be an array from our API, but add validation just in case
        const parsedFeatures = Array.isArray(property.features)
          ? property.features
          : (typeof property.features === 'string'
            ? [property.features]
            : []);
        
        return {
          ...property,
          images: parsedImages,
          features: parsedFeatures
        };
      });
    }
  });

  const handleViewDetails = (id: number) => {
    navigate(`/properties/${id}`);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  const handleExportReport = async () => {
    if (!properties || properties.length === 0) {
      toast({
        title: "No properties to export",
        description: "Please select at least one property to include in the report",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Generate and download the PDF report
      const result = await generatePropertyComparisonReport(
        sortedProperties,
        `${title} - ${new Date().toLocaleDateString()}`
      );
      
      toast({
        title: "Report generated",
        description: `Your report "${result.filename}" has been downloaded`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Report generation failed",
        description: error instanceof Error ? error.message : "Unknown error generating report",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const sortedProperties = properties ? [...properties].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle numeric values stored as strings
    if (typeof aValue === 'string' && !isNaN(Number(aValue))) {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  }) : [];

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <Card className="animate-pulse bg-white">
          <div className="p-8 text-center">
            <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <Card className="p-8 text-center bg-white">
          <p className="text-gray-700">No properties found matching your criteria.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {showExport && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center border-gray-700 text-white hover:bg-gray-700"
            >
              <ArrowDownNarrowWide className="h-4 w-4 mr-1" />
              Sort
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center border-gray-700 text-white hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center bg-blue-600 hover:bg-blue-700"
              onClick={handleExportReport}
              disabled={isExporting || !properties || properties.length === 0}
            >
              {isExporting ? (
                <>
                  <span className="h-4 w-4 mr-1 animate-spin">◌</span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      <Card className="overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead onClick={() => handleSort("address")} className="cursor-pointer text-gray-700">Property</TableHead>
                <TableHead onClick={() => handleSort("price")} className="cursor-pointer text-gray-700">Price</TableHead>
                <TableHead onClick={() => handleSort("squareFeet")} className="cursor-pointer text-gray-700">Size</TableHead>
                <TableHead onClick={() => handleSort("pricePerSqft")} className="cursor-pointer text-gray-700">$/SqFt</TableHead>
                <TableHead className="text-gray-700">Beds/Baths</TableHead>
                <TableHead onClick={() => handleSort("yearBuilt")} className="cursor-pointer text-gray-700">Year Built</TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer text-gray-700">Status</TableHead>
                <TableHead className="text-right text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProperties.map((property: Property) => (
                <TableRow 
                  key={property.id} 
                  className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => handleViewDetails(property.id)}
                >
                  <TableCell>
                    <div className="flex items-center">
                      <img 
                        className="h-16 w-24 object-cover rounded-md mr-4" 
                        src={Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : ''} 
                        alt={`${property.address}`} 
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/150x100?text=No+Image";
                        }}
                      />
                      <div>
                        <div className="font-medium text-gray-800">{property.address}</div>
                        <div className="text-sm text-gray-600">
                          {property.neighborhood}, {property.city}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-800">${Number(property.price).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">{Number(property.squareFeet).toLocaleString()} sqft</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">${property.pricePerSqft}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">{property.bedrooms} bed / {property.bathrooms} bath</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">{property.yearBuilt}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={property.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    <Button 
                      variant="link" 
                      className="text-blue-400 hover:text-blue-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(property.id);
                      }}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
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
        <span className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
          Pending
        </span>
      );
    case 'sold':
      return (
        <span className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
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

export default PropertyTable;
