import { useState } from "react";
import { Property } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  MapPin,
  DollarSign,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyTableProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

type SortField = 'price' | 'bedrooms' | 'bathrooms' | 'squareFeet' | 'yearBuilt';
type SortDirection = 'asc' | 'desc';

const PropertyTable = ({ properties, onPropertySelect }: PropertyTableProps) => {
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort properties based on current sort field and direction
  const sortedProperties = [...properties].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'price':
        aValue = parseFloat(a.price || '0');
        bValue = parseFloat(b.price || '0');
        break;
      case 'bedrooms':
        aValue = a.bedrooms || 0;
        bValue = b.bedrooms || 0;
        break;
      case 'bathrooms':
        aValue = parseFloat(a.bathrooms || '0');
        bValue = parseFloat(b.bathrooms || '0');
        break;
      case 'squareFeet':
        aValue = parseFloat(a.squareFeet || '0');
        bValue = parseFloat(b.squareFeet || '0');
        break;
      case 'yearBuilt':
        aValue = a.yearBuilt || 0;
        bValue = b.yearBuilt || 0;
        break;
      default:
        return 0;
    }

    // Handle sorting direction
    return sortDirection === 'asc' 
      ? aValue - bValue 
      : bValue - aValue;
  });

  // Generate sorting arrow indicator
  const getSortIndicator = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4" /> 
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };
  
  // Format price for display
  const formatPrice = (price: string) => {
    if (!price) return 'N/A';
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) return 'N/A';
    return parsedPrice.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => handleSort('price')}
              >
                Price {getSortIndicator('price')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => handleSort('bedrooms')}
              >
                Beds {getSortIndicator('bedrooms')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => handleSort('bathrooms')}
              >
                Baths {getSortIndicator('bathrooms')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => handleSort('squareFeet')}
              >
                Sq Ft {getSortIndicator('squareFeet')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => handleSort('yearBuilt')}
              >
                Year {getSortIndicator('yearBuilt')}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProperties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Home className="h-8 w-8 mb-2 opacity-30" />
                  <p>No properties found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedProperties.map((property) => (
              <TableRow 
                key={property.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onPropertySelect && onPropertySelect(property)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-medium">{property.address}</span>
                    <span className="text-xs text-muted-foreground flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {property.city}, {property.state} {property.zipCode}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-primary">
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    {formatPrice(property.price)}
                  </div>
                </TableCell>
                <TableCell>{property.bedrooms}</TableCell>
                <TableCell>{property.bathrooms}</TableCell>
                <TableCell>
                  {property.squareFeet 
                    ? parseInt(property.squareFeet).toLocaleString() 
                    : 'N/A'}
                </TableCell>
                <TableCell>{property.yearBuilt || 'N/A'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      property.status === 'Active' ? 'default' :
                      property.status === 'Pending' ? 'secondary' :
                      property.status === 'Sold' ? 'outline' : 
                      'default'
                    }
                  >
                    {property.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PropertyTable;