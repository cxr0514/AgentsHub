import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Property } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Download as DownloadIcon, FileText as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface PropertyComparisonTableProps {
  properties: Property[];
  onRemoveProperty?: (propertyId: number) => void;
}

const PropertyComparisonTable = ({ properties, onRemoveProperty }: PropertyComparisonTableProps) => {
  if (!properties || properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No properties selected for comparison.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate property stats
  const calculatePropertyStats = (property: Property) => {
    const pricePerSqFt = Number(property.price) / Number(property.squareFeet);
    return {
      pricePerSqFt: formatCurrency(pricePerSqFt),
      pricePerBed: formatCurrency(Number(property.price) / Number(property.bedrooms)),
      pricePerBath: formatCurrency(Number(property.price) / Number(property.bathrooms)),
      priceVsAvg: 'N/A', // This would need market data for comparison
    };
  };

  const handleExportComparison = () => {
    // This would normally generate a PDF/Excel report
    console.log('Exporting comparison for properties:', properties.map(p => p.id));
    alert('Comparison report export started. The report will be downloaded shortly.');
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Property Comparison</CardTitle>
            <CardDescription>
              Side-by-side comparison of {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleExportComparison}
          >
            <DownloadIcon size={16} />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px] font-bold">Feature</TableHead>
                {properties.map((property) => (
                  <TableHead key={property.id} className="min-w-[200px]">
                    <div className="flex flex-col">
                      <div className="font-bold truncate max-w-[180px] text-[#FF7A00]">
                        {property.address}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {property.city}, {property.state} {property.zipCode}
                      </div>
                      {onRemoveProperty && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 p-0 h-6 text-muted-foreground hover:text-destructive self-end"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveProperty(property.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Basic Information */}
              <TableRow>
                <TableCell className="font-medium">Price</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-price`}>
                    {formatCurrency(Number(property.price))}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Property Type</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-type`}>{property.propertyType}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Status</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-status`}>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : property.status === 'Pending' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {property.status}
                    </span>
                  </TableCell>
                ))}
              </TableRow>

              {/* Key Stats */}
              <TableRow>
                <TableCell className="font-medium">Bedrooms</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-bedrooms`}>{property.bedrooms}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bathrooms</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-bathrooms`}>{property.bathrooms}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Square Feet</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-sqft`}>
                    {formatNumber(Number(property.squareFeet))}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Year Built</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-year`}>
                    {property.yearBuilt || 'N/A'}
                  </TableCell>
                ))}
              </TableRow>

              {/* Advanced Metrics */}
              <TableRow>
                <TableCell className="font-medium">Price/SqFt</TableCell>
                {properties.map((property) => {
                  const stats = calculatePropertyStats(property);
                  return (
                    <TableCell key={`${property.id}-price-sqft`}>
                      {stats.pricePerSqFt}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Price/Bedroom</TableCell>
                {properties.map((property) => {
                  const stats = calculatePropertyStats(property);
                  return (
                    <TableCell key={`${property.id}-price-bed`}>
                      {stats.pricePerBed}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Days on Market</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-dom`}>
                    {property.daysOnMarket || 'N/A'}
                  </TableCell>
                ))}
              </TableRow>

              {/* Features */}
              <TableRow>
                <TableCell className="font-medium">Basement</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-basement`}>
                    {property.hasBasement ? 'Yes' : 'No'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Garage</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-garage`}>
                    {property.hasGarage ? `Yes (${property.garageSpaces || 1} spaces)` : 'No'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Lot Size</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-lot`}>
                    {property.lotSize ? `${property.lotSize} acres` : 'N/A'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyComparisonTable;