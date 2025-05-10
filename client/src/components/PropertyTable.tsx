import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  FileText 
} from "lucide-react";

interface PropertyTableProps {
  filters?: any;
  title?: string;
  showExport?: boolean;
}

const PropertyTable = ({ filters = {}, title = "Comparable Properties", showExport = true }: PropertyTableProps) => {
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<string>("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const queryString = new URLSearchParams(filters).toString();
  
  const { data: properties, isLoading } = useQuery({
    queryKey: [`/api/properties${queryString ? `?${queryString}` : ''}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      
      // Process properties to ensure images and features are properly parsed
      return data.map((property: any) => {
        let parsedImages = [];
        let parsedFeatures = [];
        
        // Extract URLs using regex pattern from property.images (string or array)
        try {
          const imageData = property.images;
          // Direct regex extraction for URLs - most reliable approach with the current data format
          const urlPattern = /(https?:\/\/[^\s"]+)/g;
          
          if (typeof imageData === 'string') {
            const matches = imageData.match(urlPattern);
            if (matches && matches.length > 0) {
              parsedImages = matches;
            }
          } else if (Array.isArray(imageData)) {
            // If it's already an array, try to process each item
            const extractedUrls = [];
            imageData.forEach(item => {
              if (typeof item === 'string') {
                const itemMatches = item.match(urlPattern);
                if (itemMatches) {
                  extractedUrls.push(...itemMatches);
                } else if (item.includes('http')) {
                  extractedUrls.push(item);
                }
              }
            });
            parsedImages = extractedUrls.length > 0 ? extractedUrls : [];
          }
        } catch (e) {
          console.warn('Failed to process property images:', e);
          parsedImages = [];
        }
        
        // Process features similarly with regex extraction for text
        try {
          const featureData = property.features;
          const wordPattern = /[a-zA-Z][a-zA-Z\s]+/g;
          
          if (typeof featureData === 'string') {
            // First try to extract words using a regex
            const matches = featureData.match(wordPattern);
            if (matches && matches.length > 0) {
              parsedFeatures = matches.map(match => match.trim()).filter(item => item.length > 0);
            }
          } else if (Array.isArray(featureData)) {
            // If it's already an array, map each item
            parsedFeatures = featureData.map(item => 
              typeof item === 'string' ? item.trim() : ''
            ).filter(item => item.length > 0);
          }
        } catch (e) {
          console.warn('Failed to process property features:', e);
          parsedFeatures = [];
        }
        
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
        <Card className="animate-pulse">
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
        <Card className="p-8 text-center">
          <p className="text-text-secondary">No properties found matching your criteria.</p>
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
            <Button variant="outline" size="sm" className="flex items-center">
              <ArrowDownNarrowWide className="h-4 w-4 mr-1" />
              Sort
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button variant="default" size="sm" className="flex items-center bg-accent hover:bg-accent/90">
              <FileText className="h-4 w-4 mr-1" />
              Export Report
            </Button>
          </div>
        )}
      </div>
      
      <Card className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("address")} className="cursor-pointer">Property</TableHead>
                <TableHead onClick={() => handleSort("price")} className="cursor-pointer">Price</TableHead>
                <TableHead onClick={() => handleSort("squareFeet")} className="cursor-pointer">Size</TableHead>
                <TableHead onClick={() => handleSort("pricePerSqft")} className="cursor-pointer">$/SqFt</TableHead>
                <TableHead>Beds/Baths</TableHead>
                <TableHead onClick={() => handleSort("yearBuilt")} className="cursor-pointer">Year Built</TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProperties.map((property: Property) => (
                <TableRow 
                  key={property.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewDetails(property.id)}
                >
                  <TableCell>
                    <div className="flex items-center">
                      <img 
                        className="h-16 w-24 object-cover rounded-md mr-4" 
                        src={JSON.parse(property.images as string)[0]} 
                        alt={`${property.address}`} 
                      />
                      <div>
                        <div className="font-medium text-primary">{property.address}</div>
                        <div className="text-sm text-text-secondary">
                          {property.neighborhood}, {property.city}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">${Number(property.price).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{Number(property.squareFeet).toLocaleString()} sqft</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">${property.pricePerSqft}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{property.bedrooms} bed / {property.bathrooms} bath</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{property.yearBuilt}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={property.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    <Button 
                      variant="link" 
                      className="text-accent hover:text-accent/80"
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
  switch (status.toLowerCase()) {
    case 'active':
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success bg-opacity-10 text-success">
          Active
        </span>
      );
    case 'pending':
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary bg-opacity-10 text-secondary">
          Pending
        </span>
      );
    case 'sold':
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          Sold
        </span>
      );
    default:
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export default PropertyTable;
